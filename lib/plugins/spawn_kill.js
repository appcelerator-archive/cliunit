var psTree = require('ps-tree');

exports.command = 'SPAWN_KILL';

exports.execute = function(state, token, callback) {
	if (state.spawn) {
		kill(state.spawn.pid, 'SIGINT', callback);
		state.spawn = null;
	}
	else {
		// this is OK, just means the spawn has already died
		callback();
	}
};

/**
 * borrowed from http://krasimirtsonev.com/blog/article/Nodejs-managing-child-processes-starting-stopping-exec-spawn
 * kill all processes in the tree. if you don't do this, you'll kill parent and orphan children
 */
var kill = function (pid, signal, callback) {
	signal   = signal || 'SIGKILL';
	callback = callback || function () {};
	if (/^win/.test(process.platform)) {
		var cp = require('child_process');
		cp.exec('taskkill /PID ' + pid + ' /T /F', callback);
	}
	else {
		psTree(pid, function (err, children) {
			[pid].concat(
				children.map(function (p) {
					return p.PID;
				})
			).forEach(function (tpid) {
				try { process.kill(tpid, signal); }
				catch (ex) { }
			});
			callback();
		});
	}
};
