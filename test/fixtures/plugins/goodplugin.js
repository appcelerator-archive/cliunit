
exports.command = 'GOOD';

exports.execute = function(state, token, callback) {
	if (token.message==='BOY') {
		callback();
	}
	else {
		callback(new Error('invalid plugin, expected BOY as message'));
	}
};