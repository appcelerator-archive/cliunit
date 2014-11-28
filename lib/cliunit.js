var util = require('util'),
	events = require('events'),
	async = require('async'),
	fs = require('fs-extra'),
	path = require('path'),
	which = require('which'),
	_ = require('lodash'),
	spawn = require('child_process').spawn,
	stripcc = require('stripcc'),
	ejs = require('ejs'),
	os = require('os'),
	chalk = require('chalk');

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

CLIUnit.prototype.addExpect = function(output, input, callback) {
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
			var env = _.merge(process.env, self.environment),
				args = self.args || [];
			var child = self._child = spawn(binary, args, {env: env});
			child.stdin.setEncoding = 'utf-8';
			child.stdout.setEncoding = 'utf-8';
			child.stderr.setEncoding = 'utf-8';
			child.stdout.on('data', function(buf){
				parseLogLine(self, 'stdout', buf);
			});
			child.stderr.on('data', function(buf){
				parseLogLine(self, 'stderr', buf);
			});
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
		self.duration = Date.now() - started;
		!err && callback && callback();
		err && self.emit('error',err);
	});

};

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
	if (name === 'stdout' && unit.expect.length) {
		var entry = unit.expect[0];
		if (entry) {
			unit.expect = _.rest(unit.expect);
			var isRegex = entry.output instanceof RegExp,
				matched = isRegex ? entry.output.test(line) : entry.output === line;
			if (matched) {
				entry.input && unit.send(entry.input);
				entry.callback && entry.callback(null, entry, line);
			}
			else {
				var error = new Error('expected "'+entry.output+'", received "'+line+'"');
				unit.emit('error', error, entry, line);
				entry.callback && entry.callback(error);
				unit._child && unit._child.kill();
			}
		}
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
	this.count > 1 && process.stdout.isTTY && process.stdout.write('\n');
	this.success.forEach(function(result){
		console.log(chalk.green('✔   ')+chalk.yellow(pad(path.relative(process.cwd(),result.unit.getFilename()),25))+chalk.gray(' ('+result.unit.getDuration()+'ms)')+' '+result.unit.getDescription());
	});
	this.failed.forEach(function(result){
		console.log(chalk.red('✘   ')+chalk.yellow(pad(path.relative(process.cwd(),result.unit.getFilename()),25))+chalk.gray(' ('+result.unit.getDuration()+'ms)')+' '+result.unit.getDescription());
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
	this.count > 1 && process.stdout.isTTY && process.stdout.write(chalk.white('.'));
	this.success.push({unit: unit});
};

TestResults.prototype.addFailure = function(unit, error) {
	this.count > 1 && process.stdout.isTTY && process.stdout.write(chalk.white.bold('!'));
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

function runScript (config, opts, fn, cb, results) {
	var lines = ejs.render(fs.readFileSync(fn).toString(), opts).split(/\n/),
		expected = [],
		args = [],
		expectedExit = 0,
		expectedError,
		unit = new CLIUnit(fn);

	results = results || new TestResults();

	if (config.timeout) {
		unit.setTimeout(config.timeout);
	}

	async.eachSeries(lines, function(line, next){
		if (line) {
			var tok = /^(EXIT|DESC|CMD|ERROR|ARG|IN|OUT):(.*)/.exec(line),
				cmd = tok && tok[1],
				msgl = tok && tok.length > 1 && tok[2], 
				msg = msgl === '' && /(OUT|IN)/.test(cmd) ? '\n' : msgl,
				isRE = msg && /^\/(.*)\/$/.test(msg),
				re = isRE && new RegExp(msg.substring(1, msg.length-1));
			if (tok) {

				switch (cmd) {
					case 'IN': {
						expected.push({
							input: re || msg,
							output: null
						});
						break;
					}
					case 'OUT': {
						var last = expected[expected.length-1];
						if (last) {
							last.output = re || msg;
						}
						else {
							expected.push({
								input: null,
								output: re || msg
							});
						}
						break;
					}
					case 'CMD': {
						// if it looks like a path, try and resolve it.
						// else we think it's probably a global command
						if (/[\.\/]+/.test(msg)) {
							var binary = path.resolve(path.dirname(fn),msg);
							unit.setBinary(binary);
						}
						else {
							return which(msg, function(err,result){
								if (err) { return next(err); }
								unit.setBinary(result);
								next();
							});
						}
						break;
					}
					case 'ARG': {
						var f = path.resolve(path.dirname(fn),msg);
						if (fs.existsSync(f)) {
							msg = f;
						}
						args.push(msg);
						break;
					}
					case 'ERROR': {
						expectedError = re || msg;
						break;
					}
					case 'EXIT': {
						expectedExit = parseInt(msg);
						break;
					}
					case 'DESC': {
						unit.setDescription(msg.trim());
						break;
					}
					default: break;
				}
			}
		}
		next();
	}, function(err){
		if (err) { return cb(err); }

		expected.forEach(function(expect){
			unit.addExpect(expect.input, expect.output);
		});

		unit.setArguments(args);

		unit.on('error',function(err){
			if (expectedError && err.message!==expectedError) {
				results.addFailure(unit, new Error("expected exit error to be: "+expectedError+", received: "+err.message));
			}
			else {
				results.addFailure(unit, err);
			}
			cb(null, results);
		});

		unit.on('timeout',function(err){
			results.addFailure(unit, err);
			cb(null, results);
		});

		unit.on('finished',function(exitCode){
			var error;
			if (expectedError) {
				var msg = unit.getStdErr(true);
				if (!msg) {
					error = new Error("expected error: "+expectedError+", received nothing in stderr");
					results.addFailure(unit, error);
					exitCode = expectedExit = -1; // force fall through
				}
				else {
					var failed = true;
					if (expectedError instanceof RegExp) {
						failed = !expectedError.test(msg);
					}
					else {
						failed = expectedError!==msg;
					}
					if (failed) {
						error = new Error("expected error: "+expectedError+", received: "+msg);
						results.addFailure(unit, error);
						exitCode = expectedExit = -1; // force fall through
					}
				}
			}
			if (exitCode!==expectedExit) {
				error = new Error("expected exit code: "+expectedExit+", received: "+exitCode);
				results.addFailure(unit, error);
			}
			else {
				results.addSuccess(unit);
			}
			cb(null, results);
		});

		if (config.debug) {
			unit.on('stdout',function(buf){
				console.log('STDOUT:',buf);
			});
			unit.on('stderr',function(buf){
				console.log('STDERR:',buf);
			});
		}    
		unit.run();
	});
}

CLIUnit.runScript = runScript;
CLIUnit.runScripts = runScripts;
