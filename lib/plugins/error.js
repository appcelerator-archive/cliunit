
exports.command = 'ERROR';
exports.supportsRegex = true;

exports.execute = function(state, token, callback) {
	state.expectedError = token.message;
	callback();
};