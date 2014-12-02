
exports.command = 'TEST';

exports.execute = function(state, token, callback) {
	var i = token.message.indexOf('='),
		k = i > 0 ? token.message.substring(0, i).trim() : token.message,
		v = i > 0 ? token.message.substring(i+1).trim() : null,
		negate = k.charAt(0)==='!';

	if (negate) {
		k = k.substring(1);
	}

	var value = state.opts[k];
	var error = match(value, v, token);

	if (negate) {
		if (!error) {
			return callback(new Error("test failed, found value for "+k));
		}
	}
	else {
		if (error) {
			return callback(error);
		}
	}
	return callback();
};

function match(value, v, token) {
	if (value) {
		// we are just checking the existing of the variable, not any specific value
		if (v===null) {
			return null;
		}
		if (/^\/(.*)\/$/.test(v)) {
			v = new RegExp(v.substring(1, v.length-1));
			if (v.test(value)) {
				return null;
			}
			else {
				return new Error("expected "+value+" to match "+v);
			}
		}
		else {
			if (v === value) {
				return null;
			}
			return new Error("expected "+value+" to equal "+v);
		}
	}
	else {
		return new Error("test failed for "+token.message);
	}
}