
exports.command = 'HTTP_SET';

exports.execute = function(state, token, callback) {
	var tok = token.message.split('='),
		k = tok[0].trim(),
		v = tok[1].trim();

	if (state.http) {
		var headers = {},
			_headers = state.http.response.headers || {};

		// lower case our headers
		Object.keys(_headers).forEach(function(key){
			headers[key.toLowerCase()] = _headers[key];
		});

		// see if the value is in headers
		if (v in headers) {
			v = headers[v];
		}
		else if (v==='body') {
			v = state.http.body;
		}
		else {
			return callback(new Error("cannot find item to set for HTTP_SET: "+v));
		}

		state.opts[k] = v;
		callback();
	}
	else {
		callback(new Error("no HTTP response found"));
	}
};