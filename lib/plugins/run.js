exports.command = 'RUN';

exports.execute = function(state, token, callback) {
	state.run(callback);
};