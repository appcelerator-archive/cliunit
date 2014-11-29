
exports.command = 'SET';

exports.execute = function(state, token, callback) {
	var tok = token.message.split('='),
		k = tok[0].trim(),
		v = tok[1].trim();
	state.opts[k] = v;
	callback();
};