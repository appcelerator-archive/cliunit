var request = require('request');

exports.command = 'HTTP';

exports.execute = function(state, token, callback) {
	var tok = token.message.split(/,\s*/),
		params = {};

	tok.forEach(function(item){
		var i = item.trim(),
			e = i.indexOf('='),
			k = i.substring(0, e).toUpperCase(),
			v = i.substring(e+1);
		if (k in params) {
			var a = params[k];
			if (Array.isArray(a)) {
				a.push(v);
			}
			else {
				params[k] = [a, v];
			}
		}
		else {
			params[k] = v;
		}
	});

	var opts = {
		url: params.URL,
		method: params.METHOD || 'get',
		headers: {},
		timeout: params.TIMEOUT || 30000,
		json: params.JSON,
		qs: params.QS,
		body: params.BODY || state.http_body,
		gzip: params.GZIP===undefined ? true : params.GZIP
	};

	if ('HEADER' in params) {
		var headers = params.HEADER;
		if (Array.isArray(headers)) {
			headers.forEach(function(line){
				parseHeader(opts.headers, line);
			});
		}
		else {
			parseHeader(opts.headers, headers);
		}
	}

	state.config.debug && console.log("HTTP:",opts);

	request(opts, function(err,response,body){
		state.http = {
			response: response,
			body: body
		};
		state.config.debug && console.log("HTTP BODY:",body);
		callback(err);
	});
};

function parseHeader(headers, line) {
	var t = line.split(':'),
		hk = t[0].trim(),
		hv = t[1].trim();
	headers[hk]=hv;
}