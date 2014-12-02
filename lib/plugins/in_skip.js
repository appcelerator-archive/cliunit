
exports.command = 'IN_SKIP';
exports.supportsRegex = false;

exports.execute = function(state, token, callback) {
	var i = token.message.indexOf('/,'),
		msg = i > 0 ? token.message.substring(0, i+1).trim() : token.message,
		name = i > 0 && token.message.substring(i+2).trim(),
		isRE = /^\/(.*)\//.test(msg),
		found;

	if (isRE) {
		msg = new RegExp(msg.substring(1, msg.length-1));
	}

	var f = function f(buf) {
		if (isRE && msg.test(buf)) {
			state.unit.removeListener('stdout',f);
			state.unit.removeListener('finished',p);
			if (name) {
				// if we have a variable, set it
				state.opts[name] = msg.exec(buf)[1];
			}
			if (callback) {
				callback();
				callback = null;
				return;
			}
		}
		else if (msg===buf) {
			state.unit.removeListener('stdout',f);
			state.unit.removeListener('finished',p);
			if (callback) {
				callback();
				callback = null;
				return;
			}
		}
	};
	var p = function p() {
		callback(new Error("IN_SKIP never matched: "+msg));
	};
	state.unit.on('stdout',f);
	state.unit.on('finished', p);
};