var which = require('which'),
	path = require('path');

exports.command = 'CMD';

exports.execute = function(state, token, callback) {
	// if it looks like a path, try and resolve it.
	// else we think it's probably a global command
	if (/[\.\/]+/.test(token.message)) {
		var binary = path.resolve(path.dirname(state.filename),token.message);
		state.unit.setBinary(binary);
		callback();
	}
	else {
		return which(token.message, function(err,result){
			if (err) { return callback(err); }
			state.unit.setBinary(result);
			callback();
		});
	}
};