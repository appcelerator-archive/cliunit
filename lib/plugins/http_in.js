
exports.command = 'HTTP_IN';
exports.supportsRegex = true;

exports.execute = function(state, token, callback) {
	if (state.http) {
		if (token.message instanceof RegExp) {
			if (token.message.test(state.http.body)) {
				return callback();
			}
		}
		else if (token.message === state.http.body) {
			return callback();
		}
		callback(new Error("invalid HTTP response body, expected: "+token.message));
	}
	else {
		callback(new Error("no HTTP response found"));
	}
};