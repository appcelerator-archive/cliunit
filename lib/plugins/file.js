var path = require('path'),
	fs = require('fs');

exports.command = 'FILE';

exports.execute = function(state, token, callback) {
	var negate = token.message.charAt(0)==='!',
		f = path.resolve(path.dirname(state.filename),negate ? token.message.substring(1) : token.message);
	if (negate) {
		f = f.substring(1);
		if (fs.existsSync(f)) {
			if (fs.statSync(f).isFile()) {
				return callback(new Error("found file: "+f));
			}
		}
		callback();
	}
	else {
		if (fs.existsSync(f)) {
			if (fs.statSync(f).isFile()) {
				return callback();
			}
			else {
				return callback(new Error("not a file: "+f));
			}
		}
		callback(new Error("couldn't find file: "+f));
	}
};