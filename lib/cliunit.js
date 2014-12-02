var util = require('util'),
	events = require('events'),
	async = require('async'),
	fs = require('fs-extra'),
	path = require('path'),
	_ = require('lodash'),
	spawn = require('child_process').spawn,
	stripcc = require('stripcc'),
	ejs = require('ejs'),
	os = require('os'),
	chalk = require('chalk'),
	showDots = (process.env.GRUNT && !process.env.TRAVIS && !process.env.NODOTS) || process.stdout.isTTY;


util.inherits(CLIUnit, events.EventEmitter);
module.exports = CLIUnit;

/**
 * CLIUnit class
 */
function CLIUnit(fn) {
	this.filename = fn;
	this.stdout = [];
	this.stderr = [];
	this.expect = [];
	this.pendingData = [];
	this.exitCode = null;
	this.timeout = 30000;
	this.duration = 0;
}

/**
 * set the test description
 * 
 * @param {String} desc description of the test
 */
CLIUnit.prototype.setDescription = function(desc) {
	this.description = desc;
	return this;
};

/**
 * return the test description
 */
CLIUnit.prototype.getDescription = function() {
	return this.description || '';
};

/**
 * return the filename for the script
 */
CLIUnit.prototype.getFilename = function() {
	return this.filename || '(program)';
};

/**
 * return the duration in milliseconds that the test took to run
 */
CLIUnit.prototype.getDuration = function() {
	return this.duration;
};

/**
 * set the name of the command binary to execute, defaults to appc
 *
 * @param {String} binary name of the binary
 */
CLIUnit.prototype.setBinary = function(binary) {
	if (!fs.existsSync(binary)) {
		throw new Error("cannot find binary at "+binary);
	}
	this.binary = binary;
};

/**
 * set the timeout for the unit to complete. will fire a `timeout` event if not
 * completed before timeout
 *
 * @param {Number} timeout in milliseconds
 */
CLIUnit.prototype.setTimeout = function(timeout) {
	this.timeout = timeout;
};

CLIUnit.prototype.addExpect = function(input, output, callback) {
	this.expect.push({
		output: output,
		input: input,
		callback: callback
	});
};

/**
 * set the environment hash (key=value) when running binary
 *
 * @param {Object} env hash
 */
CLIUnit.prototype.setEnvironment = function(env) {
	this.environment = env;
	return this;
};

/**
 * set the arguments when running binary
 *
 * @param {Array} args arguments array
 */
CLIUnit.prototype.setArguments = function(args) {
	this.args = args;
	return this;
};

/**
 * return the standard output from the process
 *
 * @param {boolean} asString if true, returns as a string joined by new lines, otherwise an array
 */
CLIUnit.prototype.getStdOut = function(asString) {
	return asString ? this.stdout.join('\n') : this.stdout;
};

/**
 * return the standard error from the process
 *
 * @param {boolean} asString if true, returns as a string joined by new lines, otherwise an array
 */
CLIUnit.prototype.getStdErr = function(asString) {
	return asString ? this.stderr.join('\n') : this.stderr;
};

/**
 * return the exit code.  if null, the process has not yet finished
 */
CLIUnit.prototype.getExitCode = function() {
	return this.exitCode;
};

/**
 * returns true if timed out or false if not
 */
CLIUnit.prototype.didTimeout = function() {
	return !!this.timedout;
};

/**
 * send input to the running process
 *
 * @param {String} buf buffer to send
 */
CLIUnit.prototype.send = function(buf) {
	if (!this._child) {
		throw new Error("not running");
	}
	this._child.stdin.write(buf);
	if (!/\n$/.test(buf)) {
		this._child.stdin.write('\n');
	}
};

/**
 * execute the unit test
 *
 * @param {Function} callback optional callback when the run has started running
 */
CLIUnit.prototype.run = function(callback) {

	var self = this,
		started = Date.now();

	async.waterfall([

		// emit the starting event
		function (cb) {
			self.emit('starting');
			cb(null, self.binary);
		},

		// start the process
		function (binary, cb) {
			if (!binary) {
				return cb(new Error("setBinary must be called before run"));
			}
			var env = _.merge(_.merge(process.env, self.environment), {NODOTS:1}),
				args = self.args || [],
				child = self._child = spawn(binary, args, {env: env});

			child.stdin.setEncoding = 'utf-8';
			child.stdout.setEncoding = 'utf-8';
			child.stderr.setEncoding = 'utf-8';

			child.stdout.on('data', makeBufferer(self,'stdout'));
			child.stderr.on('data', makeBufferer(self,'stderr'));

			child.on('close', function(code){
				clearTimeout(self._timer);
				self.exitCode = code;
				self._child = null;
				self._timer = null;
				self.emit('finished', code);
			});
			// setup our timer
			self._timer = setTimeout(function(){
				self.timedout = true;
				self.emit('timeout', 'timed out after '+self.timeout+' ms');
				self._child && self._child.kill();
			}, self.timeout);
			cb(null, binary, child);
		},

		// fire started event
		function (binary, child, cb) {
			self.emit('started', child);
			cb(null, binary, child);
		}

	], function(err){
		//FIXME duration
		self.duration = Date.now() - started;
		!err && callback && callback();
		err && self.emit('error',err);
	});

};

function makeBufferer(unit, name) {
	var pending,
		timer;
	return function(buf) {
		if (timer) {
			clearTimeout(timer);
		}
		if (pending) {
			// we have a pending buffer we're waiting on, just append
			pending = Buffer.concat([pending, buf]);
		}
		else {
			pending = buf;
		}
		if (pending[pending.length-1]===10) {
			parseLogLine(unit, name, pending);
			pending = null;
		}
		else {
			var s = pending.toString(),
				i = s.indexOf('\n');
			// if we at least found one buffer with a new line ending, go ahead
			// and send it while we wait on more
			if (i !== -1) {
				s = s.substring(0, i);
				pending = new Buffer(s.substring(i+1));
				parseLogLine(unit,name,s);
			}
			// if we don't have a new line incoming, we are going to
			// wait 10ms and see if we get one (sometimes buffered output
			// splits up lines). if not, we can assume this is not a line
			// with a newline and just proceed after 10ms of waiting
			timer = setTimeout(function(){
				parseLogLine(unit,name,pending);
				pending = null;
				timer = null;
			},10);
		}
	};
}



/**
 * parse the buffer into the appropriate string lines and
 * then fire an event for each line and stick in the appropriate
 * array
 */
function parseLogLine(unit, name, buf) {
	var array = unit[name],
		lines = stripcc(buf.toString()).split(/(\r?\n)/g);
	lines.forEach(function(line){
		line = line.replace(/\n$/,'').replace(/\[2K/g,'').replace(/\[1A/g,'').replace(/\[\?25h/g,'');
		if (line) {
			array.push(line);
			unit.emit(name, line);
			handleExpect(unit, name, line);
		}
	});
}

function handleExpect(unit, name, line) {
	var expect = unit.state ? unit.state.expected : unit.expect;
	if (name === 'stdout' && expect.length) {
		var entry = expect[0];
		//console.log('line=',line,entry.output);
		//console.log('line=',line,name,expect.length,entry.input);
		if (entry) {
			unit.state ? (unit.state.expected = _.rest(expect)) : (unit.expect = _.rest(expect));
			var isRegex = entry.input instanceof RegExp,
				matched = isRegex ? entry.input.test(line) : entry.input === line;
			if (matched) {
				entry.output && unit.send(entry.output);
				entry.callback && entry.callback(null, entry, line);
			}
			else {
				var error = new Error('expected "'+entry.input+'", received "'+line+'"');
				unit.emit('error', error, entry, line);
				entry.callback && entry.callback(error);
				unit._child && unit._child.kill();
			}
		}
	}
	else {
		unit.pendingData.push(line);
	}
}

function TestResults() {
	this.success = [];
	this.failed = [];
	this.count = 1;
}

function pad(str, len) {
	len = len - str.length;
	return str + (len > 0 ? new Array(len).join(' ') : '');
}

function plural(str, len) {
	return str + (len > 1 || len === 0 ? 's':'');
}

TestResults.prototype.printResults = function(config, exit) {
	this.count > 1 && showDots && process.stdout.write('\n');
	this.success.forEach(function(result){
		console.log(chalk.green('✔  ')+chalk.yellow(pad(path.relative(process.cwd(),result.unit.getFilename()),28))+chalk.gray(' ('+pad(result.unit.getDuration()+'ms)',6))+' '+chalk.cyan(result.unit.getDescription()));
	});
	this.failed.forEach(function(result){
		console.log(chalk.red('✘  ')+chalk.yellow(pad(path.relative(process.cwd(),result.unit.getFilename()),28))+chalk.gray(' ('+pad(result.unit.getDuration()+'ms)',6))+' '+chalk.cyan(result.unit.getDescription()));
	});

	if (this.didFail()) {
		var count = this.failedCount(),
			banner = plural('Test Failure',count)+':';
		console.log('\n'+chalk.bold(banner)+'\n');
		this.failed.forEach(function(result){
			var msg = chalk.red(result.error.message || result.error);
			console.log(chalk.yellow.underline(path.relative(process.cwd(),result.unit.getFilename()))+'\n'+msg);
			console.log('');
		});
	}
	var good = this.successCount(),
		fail = this.failedCount(),
		msg = '\n'+chalk.green(good)+' '+chalk.green(plural('test',good)+' succeeded');

	if (fail) {
		msg += chalk.grey(', ')+chalk.red(fail)+' '+chalk.red(plural('test',fail)+' failed');
	}
	else {
		msg += chalk.green('!');
	}
	console.log(msg);
	exit && process.exit(this.didFail() ? 1 : 0);
};

TestResults.prototype.addSuccess = function(unit) {
	this.count > 1 && showDots && process.stdout.write(chalk.white('.'));
	this.success.push({unit: unit});
};

TestResults.prototype.addFailure = function(unit, error) {
	this.count > 1 && showDots && process.stdout.write(chalk.white.bold('!'));
	this.failed.push({unit: unit, error: error});
};

TestResults.prototype.didSuceeed = function() {
	return this.failed.length===0;
};

TestResults.prototype.didFail = function() {
	return this.failed.length;
};

TestResults.prototype.successCount = function() {
	return this.success.length;
};

TestResults.prototype.count = function() {
	return this.success.length + this.failed.length;
};

TestResults.prototype.failedCount = function() {
	return this.failed.length;
};

function runScripts (config, opts, files, cb) {
	var results = new TestResults();
	results.count = files.length;
	async.eachSeries(files, function(file, next) {
		runScript(config, opts, file, next, results);
	},function(err){
		return cb(err,results);
	});
}

/**
 * load a plugin
 */
function loadPlugin(plugins, name) {
	var plugin = require(name);
	if (!plugin.command) {
		throw new Error("invalid plugin. command is not specified");
	}
	plugins[plugin.command] = plugin;
}

/**
 * utility for loading plugins
 */
function loadPlugins(plugins, name) {
	if (_.isString(name)) {
		name = name.trim();
		if (fs.existsSync(name)) {
			if (fs.statSync(name).isDirectory()) {
				return fs.readdirSync(name).filter(function(fn){
					return path.extname(fn)==='.js';
				}).forEach(function(fn){
					loadPlugin(plugins, path.join(name,fn));
				});
			}
			else {
				return loadPlugin(plugins, name);
			}
		}
		else {
			return loadPlugin(plugins, name);
		}
	}
	else if (_.isObject(name)) {
		return name;
	}
	else if (_.isArray(name)) {
		return name.forEach(function(n){
			loadPlugins(plugins, n);
		});
	}
	throw new Error("invalid plugin type: "+typeof(name)+" for "+name);
}

/**
 * utility that will join continuation lines that are signified with ending \
 */
function preprocessLines(fn, cb) {
	// NOTE: only call cb if we have an error
	var lines = fs.readFileSync(fn).toString().split(/\n/),
		newlines = [],
		pending,
		dir = path.dirname(fn),
		includeRE = /INCLUDE (.*)/;
	for (var c=0;c<lines.length;c++) {
		var line = lines[c],
			endsWithSlash = /\\$/.test(line);
		if (endsWithSlash) {
			var str = line.substring(0, line.length-1);
			if (pending) {
				pending+=str;
			}
			else {
				pending=str;
			}
		}
		else {
			if (pending) {
				line = pending + line;
				pending = null;
			}
			if (includeRE.test(line)) {
				var m = includeRE.exec(line);
				var f = path.resolve(dir, m[1].trim());
				if (!fs.existsSync(f)) {
					return cb(new Error("couldn't find include file at "+f));
				}
				var include = preprocessLines(f, cb);
				newlines = newlines.concat(include);
				continue;
			}
			else if (line.charAt(0)==='#' || line.trim()==='') {
				continue;
			}
			newlines.push(line);
		}
	}
	if (pending) {
		newlines.push(pending);
	}
	return newlines;
}

function runScript (config, opts, fn, cb, results) {
	var lines = preprocessLines(fn, cb),
		expected = [],
		args = [],
		unit = new CLIUnit(fn),
		plugins = {};

	results = results || new TestResults();
	opts = _.defaults(opts, {filename:fn});

	if (config.timeout) {
		unit.setTimeout(config.timeout);
	}

	// load our built-in plugins first, so that they can be ultimately overwritten
	fs.readdirSync(path.join(__dirname,'plugins')).filter(function(f){
		return path.extname(f)==='.js';
	}).forEach(function(fn){
		var plugin = require(path.join(__dirname,'plugins',fn));
		plugin.command && (plugins[plugin.command] = plugin);
	});

	// attempt to load third-party plugins
	if (config.plugins) {
		loadPlugins(plugins, config.plugins);
	}

	// this is the object we pass to all plugins to allow them to control
	// the flow of execution
	var regex = new RegExp('^(' + Object.keys(plugins).join('|')+'):(.*)'),
		state = {
			expected: expected,
			unit: unit,
			args: args,
			expectedExit: 0,
			expectedError: null,
			filename: fn,
			config: config,
			opts: opts,
			// allow plugins to load other plugins, regenerate the regex after adding
			addPlugin: function(plugin) {
				if (!_.isObject(plugin)) {
					throw new Error("invalid plugin. must be a loaded module for "+plugin);
				}
				plugins[plugin.command] = plugin;
				// rebuild the regex
				regex = new RegExp('^(' + Object.keys(plugins).join('|')+'):(.*)');
			}
		},
		running = false,
		allProcessed = false,
		finishedExit;

	unit.state = state;

	function run (cb) {
		if (!running) {
			expected.forEach(function(expect){
				unit.addExpect(expect.input, expect.output);
			});
			unit.setArguments(args);
			if (unit.run && unit.binary) {
				unit.run(cb);
			}
			else {
				cb();
			}
			running = true;
			args = [];
			expected = [];
		}
		else {
			cb && cb();
		}
	}
	state.run = run;

	var pluginsExecuted = [];

	function pluginsFinished(results, callback) {
		// see if any plugins want to be notified when we're done
		async.eachSeries(pluginsExecuted, function(plugin, next) {
			if (plugin.finished) {
				plugin.finished(state, results, next);
			}
			else {
				next();
			}
		}, callback);
	}

	unit.on('error',function(err){
		if (state.expectedError && err.message!==state.expectedError) {
			results.addFailure(unit, new Error("expected exit error to be: "+state.expectedError+", received: "+err.message));
		}
		else {
			results.addFailure(unit, err);
		}
		pluginsFinished(results, cb);
	});

	unit.on('timeout',function(err){
		results.addFailure(unit, err);
		pluginsFinished(results, cb);
	});

	// allow others to pipe data into our system
	unit.on('pipe_stdout', makeBufferer(unit,'stdout'));
	unit.on('pipe_stderr', makeBufferer(unit,'stderr'));

	// called when finished
	unit.on('finished',function(exitCode){

		// if we're still processing lines, we need to record our exit code
		// and return later
		if (!allProcessed) {
			state.expected = [];
			finishedExit = exitCode;
			return;
		}

		// if we have pending data and we're finished, flush them
		if (unit.pendingData.length) {
			unit.pendingData.forEach(function(line){
				handleExpect(unit,'stdout',line);
			});
		}
		var error;
		if (state.expectedError) {
			var msg = unit.getStdErr(true);
			if (!msg) {
				error = new Error("expected error: "+state.expectedError+", received nothing in stderr");
				results.addFailure(unit, error);
				exitCode = state.expectedExit = -1; // force fall through
			}
			else {
				var failed = true;
				if (state.expectedError instanceof RegExp) {
					failed = !state.expectedError.test(msg);
				}
				else {
					failed = state.expectedError!==msg;
				}
				if (failed) {
					error = new Error("expected error: "+state.expectedError+", received: "+msg);
					results.addFailure(unit, error);
					exitCode = state.expectedExit = -1; // force fall through
				}
			}
		}
		if (exitCode!==state.expectedExit) {
			error = new Error("expected exit code: "+state.expectedExit+", received: "+exitCode);
			results.addFailure(unit, error);
		}
		else {
			results.addSuccess(unit);
		}

		pluginsFinished(results, cb);
	});

	unit.on('stdout',function(buf){
		config.debug && console.log('STDOUT:',buf);
		if (finishedExit!==undefined) {
			handleExpect(unit,'stdout',buf);
		}
	});

	unit.on('stderr',function(buf){
		config.debug && console.log('STDERR:',buf);
		if (finishedExit!==undefined) {
			handleExpect(unit,'stderr',buf);
		}
	});

	// loop through each line, delegating to our registered plugin
	async.eachSeries(lines, function(line, next){
		if (line) {

			// do it for each line so that plugins can change/set/remove values
			try {
				state.opts.state = state;
				line = ejs.render(line, state.opts);
				delete state.opts.state;
			}
			catch (E) {
				return next(new Error("invalid EJS evaluation. "+E.message));
			}

			var tok = regex.exec(line),
				cmd = tok && tok[1],
				// allow \n and \t in the text but it will come in escaped so we need to unescape
				msgl = tok && tok.length > 1 && tok[2].replace(/\\n/g, '\n').replace(/\\t/g,'\t'),
				plugin = plugins[cmd],
				msg = plugin && msgl === '' && plugin.sendNewLineOnBlank ? '\n' : msgl,
				isRE = msg && plugin.supportsRegex && /^\/(.*)\/$/.test(msg),
				re = isRE && new RegExp(msg.substring(1, msg.length-1));
			if (tok) {
				if (!plugin) {
					return next(new Error("unsupported command: "+cmd+" for "+line));
				}
				var token = {
					line: line,
					command: cmd,
					message: re || msg
				};

				pluginsExecuted.push(plugin);

				// console.log('BEFORE PLUGIN',plugin.command);
				return plugin.execute(state, token, function(err) {
					// console.log('AFTER PLUGIN',plugin.command);
					if (err) { return next(err); }
					if (unit.pendingData.length) {
						unit.pendingData.forEach(function(line){
							handleExpect(unit,'stdout',line);
						});
						unit.pendingData=[];
					}
					next();
				});
			}
			else {
				if (line.trim().charAt(0)!=='#') {
					return next(new Error("unrecognized instruction: "+line));
				}
			}
		}
		next();
	}, function(err){

		allProcessed = true;

		if (err) { 
			return unit.emit('error',err);
		}

		unit.emit('processed');

		// if we have a binary to run, run it
		run(function(){
			if (finishedExit!==undefined) {
				unit.emit('finished',finishedExit);
			}
		});

		if (!unit.binary) {
			// go ahead and just finish if we're not running a cmd
			unit.emit('finished',0);
		}
	});
}

CLIUnit.runScript = runScript;
CLIUnit.runScripts = runScripts;
