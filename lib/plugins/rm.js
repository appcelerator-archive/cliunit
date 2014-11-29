var path = require('path'),
	fs = require('fs-extra');

exports.command = 'RM';

exports.execute = function(state, token, callback) {
	var f = path.resolve(path.dirname(state.filename),token.message);
	fs.remove(f, callback);
};