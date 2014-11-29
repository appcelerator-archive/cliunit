var path = require('path'),
	fs = require('fs-extra');

exports.command = 'MKDIR';

exports.execute = function(state, token, callback) {
	var f = path.resolve(path.dirname(state.filename),token.message.trim());
	fs.mkdirs(f, callback);
};