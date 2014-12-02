var jsdiff = require('diff'),
	chalk = require('chalk');

exports.command = 'HTTP_IN';
exports.supportsRegex = true;

exports.execute = function(state, token, callback) {
	if (state.http) {
		var body = String(state.http.body).trim();
		if (token.message instanceof RegExp) {
			if (token.message.test(body)) {
				return callback();
			}
		}
		else if (token.message.trim() === body) {
			return callback();
		}

		var diff = jsdiff.diffChars(String(token.message), body);
		var message = [];

		diff.forEach(function(part){
			// green for additions, red for deletions
			// grey for common parts
			var color = part.added ? chalk.green : part.removed ? chalk.red : chalk.grey;
			message.push(color(part.value));
		});

		callback(new Error("invalid HTTP response body, expected: ["+token.message+"], was ["+message.join('')+"]"));
	}
	else {
		callback(new Error("no HTTP response found"));
	}
};