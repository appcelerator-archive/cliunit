#!/usr/bin/env node

var fs = require('fs-extra'),
	path = require('path'),
	dir = process.argv[2];

// delete directory passed in
if (fs.existsSync(dir)) {
	fs.rmdirSync(dir);
}
else {
	console.error("Couldn't find directory: "+dir);
	process.exit(1);
}
