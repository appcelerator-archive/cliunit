
exports.command = 'HTTP_HEADER';

var re = /^\/(.*)\/$/;

function transformValue(value) {
	if (re.test(value)) {
		return new RegExp(value.substring(1, value.length-1));
	}
	return value;
}
exports.execute = function(state, token, callback) {
	if (state.http) {
		var headers = {},
			_headers = state.http.response.headers || {};

		// lower case our headers
		Object.keys(_headers).forEach(function(key){
			headers[key.toLowerCase()] = _headers[key];
		});

		var tok = token.message.split('='),
			k = (tok.length ? tok[0] : token.message).trim(),
			v = tok.length > 1 ? tok[1].trim() : null,
			value = v && transformValue(v),
			header = headers[k.toLowerCase()];

		if (!header) {
			return callback(new Error("HTTP header '"+k+'" not found in HTTP response'));
		}

		// if we have a value to test
		if (value) {
			if (value instanceof RegExp) {
				if (value.test(header)) {
					return callback();
				}
			}
			else if (value === header) {
				return callback();
			}
			return callback(new Error("HTTP header '"+k+"' doesn't match: "+value));
		}

		// otherwise, just the present of the header is enough to pass
		callback();
	}
	else {
		callback(new Error("no HTTP response found"));
	}
};