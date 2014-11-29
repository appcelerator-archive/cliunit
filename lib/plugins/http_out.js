
exports.command = 'HTTP_OUT';

exports.execute = function(state, token, callback) {
	state.http_body = token.message && token.message!=='' ? token.message : undefined;
	callback();
};