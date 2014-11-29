var path = require('path'),
	fs = require('fs');

exports.command = 'PLUGIN';

exports.execute = function(state, token, callback) {
	var fn = path.resolve(path.dirname(state.filename),token.message);
	if (!fs.existsSync(fn)) {
		return callback(new Error("cannot find plugin at "+fn));
	}
	var plugin = require(fn);
	state.addPlugin(plugin);
	callback();
};