
exports.command = 'DESC';

exports.execute = function(state, token, callback) {
	state.unit.setDescription(token.message.trim());
	callback();
};