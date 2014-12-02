
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
		else if (/^body,?/.test(v)){
			v = state.http.body;
			var i = v.indexOf(',');
			if (i > 0) {
				i = token.message.indexOf('body,');
				var line = token.message.substring(i+5);
				if (/^\/(.*)\/$/.test(line)) {
					line = new RegExp(line.substring(1, line.length-1));
				}
				else {
					return callback(new Error("body expression must be a regular expression"));
				}
				var match = line.exec(v);
				if (match.length > 1) {
					v = match[1];
				}
				else {
					return callback(new Error("no match found for regular expression: "+line+" for "+v));
				}
			}
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