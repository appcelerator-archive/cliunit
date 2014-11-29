
exports.command = 'IN';
exports.supportsRegex = true;
exports.sendNewLineOnBlank = true;
exports.requiresRunning = true;

exports.execute = function(state, token, callback) {
	state.expected.push({
		input: token.message
	});
	callback();
};