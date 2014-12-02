var spawn = require('child_process').spawn,
	which = require('which'),
	path = require('path'),
	spawnkill = require('./spawn_kill');

exports.command = 'SPAWN';
exports.requiresRunning = true;

exports.execute = function(state, token, callback) {
	var cmd = token.message,
		tok = cmd.split(/,\s*/).map(function(a) { return a.trim(); }),
		bin = tok[0],
		args = tok.splice(1);

	if (/[\/\.]/.test(bin)) {
		bin = path.resolve(path.dirname(state.filename), bin);
		exec(state, bin, args, callback);
	}
	else {
		which(bin, function(err,result){
			if (err) { return callback(err); }
			bin = result;
			exec(state, bin, args, callback);
		});
	}
};

exports.finished = function(state, results, next) {
	// we do this in case the script fails or forgets to call SPAWN_KILL
	if (state.spawn) {
		spawnkill.execute(state, null, next);
	}
	else {
		next();
	}
};

function exec(state, bin, args, callback) {
	var opts = {};
	if (state.spawn_cwd) {
		opts.cwd = state.spawn_cwd;
	}
	// console.log('>>>>>>> spawn:',bin,args,opts.cwd);
	var s = state.spawn = spawn(bin, args, opts);
	var f = function f() {
		state.spawn = null;
		s.removeListener('close',f);
	};
	s.on('error',callback);
	s.on('exit',f);
	callback();
}