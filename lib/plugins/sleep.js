
exports.command = 'SLEEP';

exports.execute = function(state, token, callback) {
	setTimeout(callback, parseInt(token.message));
};