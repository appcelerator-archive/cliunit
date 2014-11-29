
exports.command = 'IN_SKIP';
exports.supportsRegex = true;
exports.requiresRunning = true;

exports.execute = function(state, token, callback) {
	var msg = token.message,
		isRE = msg instanceof RegExp,
		found;

	for (var c=0;c<state.expected.length;c++) {
		var line = state.expected[c];
		if (isRE && msg.test(line)) {
			// found it
			found = true;
		}
		else if (msg===line) {
			// found it
			found = true;
		}
		if (found) {
			state.expected = state.expected.splice(c > 0 ? c-1 : c);
			break;
		}
		else {
			continue;
		}
	}
	if (found) {
		callback();
	}
	else {
		var f = function f(buf) {
			if (isRE && msg.test(buf)) {
				state.unit.removeListener('stdout',f);
				return callback();
			}
			else if (msg===buf) {
				state.unit.removeListener('stdout',f);
				return callback();
			}
		};
		state.unit.on('stdout',f);
	}
};