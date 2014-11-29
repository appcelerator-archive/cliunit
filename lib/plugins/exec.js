var which = require('which'),
	path = require('path'),
	fs = require('fs'),
	exec = require('child_process').exec;

exports.command = 'EXEC';
exports.requiresRunning = true;

exports.execute = function(state, token, callback) {
	exec(token.message, function(err,stdout,stderr) {
		// for now, we ignore output
		callback(err);
	});
};