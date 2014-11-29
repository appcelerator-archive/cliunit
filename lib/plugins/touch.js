var path = require('path'),
	fs = require('fs-extra');

exports.command = 'TOUCH';

exports.execute = function(state, token, callback) {
	var f = path.resolve(path.dirname(state.filename), token.message.trim());
	fs.outputFile(f, '', callback);
};