var path = require('path'),
	fs = require('fs');

exports.command = 'ARG';

exports.execute = function(state, token, callback) {
	var f = path.resolve(path.dirname(state.filename),token.message),
		msg = token.message;
	if (fs.existsSync(f)) {
		msg = f;
	}
	state.args.push(msg);
	callback();
};