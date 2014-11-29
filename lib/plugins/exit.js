
exports.command = 'EXIT';
exports.requiresRunning = true;

exports.execute = function(state, token, callback) {
	state.expectedExit = parseInt(token.message);
	if (state.unit._child) {
		state.unit._child.on('close',function(){
			// block until we are done
			callback();
		});
	}
	else {
		callback();
	}
};