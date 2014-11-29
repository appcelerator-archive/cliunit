var path = require('path'),
	fs = require('fs-extra');

exports.command = 'SYMLINK';

exports.execute = function(state, token, callback) {
	var tok = token.message.split(/,\s*/);
	// first is working directory
	// second is directory to link
	// third is name (optional)
	if (tok.length < 2) {
		return callback(new Error("invalid usage. requires at least 2 parameters separated by comma"));
	}
	var dir = path.dirname(state.filename),
		cwd = path.resolve(dir, tok[0].trim()),
		link = path.resolve(dir, tok[1].trim()),
		// if we have a name, use it, otherwise its the name of the directory we are linking to
		name = tok.length > 2 ? tok[2].trim() : path.basename(link),
		dest = path.join(cwd, name);
	if (!fs.existsSync(cwd)) {
		return callback(new Error("invalid working directory: "+cwd));
	}
	if (!fs.existsSync(link)) {
		return callback(new Error("invalid link directory: "+cwd));
	}
	fs.symlink(link, dest, callback);
};