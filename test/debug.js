var CLIUnit = require('../'),
	path = require('path'),
	pkg = require('../package.json');

describe("debug", function(){
	it("should print out current version with debug", function(done){
		var unit = new CLIUnit(__filename);
		unit.setBinary(path.join(__dirname,'../bin/cliunit'));
		unit.setArguments(['--debug', path.join(__dirname,'version.txt')]);
		unit.addExpect('STDOUT: '+pkg.version);
		function error(err) {
			done && done(err);
			done = null;
		}
		unit.on('timeout',error);
		unit.on('error',error);
		unit.on('finished', function(err,results){
			if (err) { return error(err); }
			error();
		});
		unit.run();
	});
});