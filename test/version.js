var CLIUnit = require('../'),
	path = require('path'),
	pkg = require('../package.json');

describe("version", function(){
	it("should print out current version", function(done){
		var unit = new CLIUnit(__filename);
		unit.setBinary(path.join(__dirname,'../bin/cliunit'));
		unit.setArguments(['--version']);
		unit.addExpect(pkg.version);
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