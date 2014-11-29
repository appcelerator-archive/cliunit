var path = require('path'),
	fs = require('fs');

exports.command = 'ECHO';

exports.execute = function(state, token, callback) {
	console.log(token.message);
	callback();
};