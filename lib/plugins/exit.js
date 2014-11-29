
exports.command = 'EXIT';

exports.execute = function(state, token, callback) {
	state.expectedExit = parseInt(token.message);
	callback();
};