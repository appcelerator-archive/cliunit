
exports.command = 'SPAWN_IN';

exports.execute = function(state, token, callback) {
	if (state.spawn) {
		state.spawn.stdout.on('data', function(buf){
			state.unit.emit('pipe_stdout',buf);
		});
        callback();
	}
	else {
		return callback(new Error("no process was spawned"));
	}
};
