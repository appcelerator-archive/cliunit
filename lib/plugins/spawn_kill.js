
exports.command = 'SPAWN_KILL';

exports.execute = function(state, token, callback) {
	if (state.spawn) {
		var spawn = state.spawn,
			timer,
			f = function f() {
				clearTimeout(timer);
				timer=null;
				spawn.removeListener('close',f);
				callback();
			};
		state.spawn.on('close',f);
		state.spawn.kill();
		timer = setTimeout(function(){
			var exec = require('child_process').exec;
			//exec('ps -ef | grep node')
			//console.log('forcing kill of '+spawn.pid);
			//exec('/bin/kill -9 '+spawn.pid, f);
		},2000);
	}
	else {
		// this is OK, just means the spawn has already died
		callback();
	}
};
