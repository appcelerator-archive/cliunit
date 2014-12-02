
exports.command = 'HTTP_HEADER';

var re = /^\/(.*)\/$/;

function transformValue(value) {
	if (value && re.test(value)) {
		return new RegExp(value.substring(1, value.length-1));
	}
	else if (value) {
		return value;
	}
	// wildcard match
	return /(.*)/;
}
exports.execute = function(state, token, callback) {
	if (state.http) {
		var headers = {},
			_headers = state.http.response.headers || {};

		// lower case our headers
		Object.keys(_headers).forEach(function(key){
			headers[key.toLowerCase()] = _headers[key];
		});

		// only dump headers once if debug is on
		if (!state.http.headersDumped && state.config.debug) {
			 console.log("HTTP HEADERS:",headers);
			 state.http.headersDumped=true;
		}

		var tok = token.message.split('='),
			k = (tok.length ? tok[0] : token.message).trim(),
			v = tok.length > 1 ? tok[1].trim() : null,
			value = transformValue(v),
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
			return callback(new Error("HTTP header '"+k+"' doesn't match: "+value+", was: "+header));
		}

		// otherwise, just the present of the header is enough to pass
		callback();
	}
	else {
		callback(new Error("no HTTP response found"));
	}
};