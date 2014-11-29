var path = require('path');

exports.command = 'SPAWN_CWD';

exports.execute = function(state, token, callback) {
	state.spawn_cwd = path.resolve(path.dirname(state.filename), token.message);
	callback();
};
