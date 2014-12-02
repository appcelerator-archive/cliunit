
exports.command = 'IN_SET';
exports.supportsRegex = true;
exports.sendNewLineOnBlank = true;

exports.execute = function(state, token, callback) {
	var i = token.message.indexOf('='),
		name = i > 0 && token.message.substring(0, i),
		value = i > 0 && token.message.substring(i+1);
	if (!name || !value) {
		return callback(new Error("invalid format. should be VAR=REGEX"));
	}
	if (!/^\/(.*)\/$/.test(value)) {
		return callback(new Error("invalid format. value must be a regular expression"));
	}
	value = new RegExp(value.substring(1, value.length-1));
	var listener = function listener(buf) {
		state.unit.removeListener('stdout', listener);
		if (value.test(buf)) {
			var match = value.exec(buf);
			state.opts[name] = match[1];
			callback();
		}
		else {
			var error = new Error('expected "'+value+'", received "'+buf+'"');
			return callback(error);
		}
	};
	state.unit.on('stdout', listener);
};