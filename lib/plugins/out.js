
exports.command = 'OUT';
exports.supportsRegex = true;
exports.sendNewLineOnBlank = true;

exports.execute = function(state, token, callback) {
	var last = state.expected[state.expected.length-1];
	if (last) {
		last.output = token.message;
	}
	else {
		state.expected.push({
			output: token.message
		});
	}
	callback();
};