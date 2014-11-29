var path = require('path'),
	fs = require('fs');

exports.command = 'FILE_SET';

exports.execute = function(state, token, callback) {
	var tok = token.message.split('='),
		k = tok[0].trim(),
		v = tok[1].trim(),
		sk = tok.length > 2 ? tok[2].trim() : null,
		fn = path.resolve(path.dirname(state.filename), v),
		ext = path.extname(fn).substring(1),
		j;

	if (!fs.existsSync(fn)) {
		return callback(new Error("couldn't find file at "+fn));
	}

	switch (ext) {
		case 'json': {
			try {
				j = JSON.parse(fs.readFileSync(fn).toString());
				if (sk) {
					state.opts[k] = j[sk];
				}
				else {
					state.opts[k] = j;
				}
			}
			catch (E) {
				return callback("Error parsing JSON at "+fn+", "+E.message);
			}
			break;
		}
		case 'js': {
			try {
				j = require(fn);
				if (sk) {
					state.opts[k] = j[sk];
				}
				else {
					state.opts[k] = j;
				}
			}
			catch (E) {
				return callback("Error loading JS at "+fn+", "+E.message);
			}
			break;
		}
		default: {
			// just read in contents of file
			j = fs.readFileSync(fn);
			break;
		}
	}
	callback();
};