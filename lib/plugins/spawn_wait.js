
exports.command = 'SPAWN_WAIT';

exports.execute = function(state, token, callback) {
	if (state.spawn) {
		state.spawn.on('close', function(){
            state.spawn = null;
			callback();
		});
	}
	else {
		return callback(new Error("no process was spawned"));
	}
};
