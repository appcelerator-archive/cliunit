var path = require('path'),
	fs = require('fs');

exports.command = 'DIR';

exports.execute = function(state, token, callback) {
	var negate = token.message.charAt(0)==='!',
		f = path.resolve(path.dirname(state.filename),negate ? token.message.substring(1) : token.message);
	if (negate) {
		f = f.substring(1);
		if (fs.existsSync(f)) {
			if (fs.statSync(f).isDirectory()) {
				return callback(new Error("found directory: "+f));
			}
		}
		callback();
	}
	else {
		if (fs.existsSync(f)) {
			if (fs.statSync(f).isDirectory()) {
				return callback();
			}
			else {
				return callback(new Error("not a directory: "+f));
			}
		}
		callback(new Error("couldn't find directory: "+f));
	}
};