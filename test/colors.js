var CLIUnit = require('../'),
	path = require('path'),
	pkg = require('../package.json');

describe("colors", function(){
	it("should print out version using colors", function(done){
		var unit = new CLIUnit(__filename);
		unit.setBinary(path.join(__dirname,'../bin/cliunit'));
		unit.setArguments(['--debug', '--colors', 'true', path.join(__dirname,'version.txt')]);
		unit.addExpect('STDOUT: '+pkg.version);
		unit.addExpect(/\[32m✔\s+\[39m\[33mtest\/version\.txt\s+\[39m\[90m\s\(\d+ms\)\s+\[39m\s+\[36mshould print out current version\[39m/);

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
	it("should print out version without colors", function(done){
		var unit = new CLIUnit(__filename);
		unit.setBinary(path.join(__dirname,'../bin/cliunit'));
		unit.setArguments(['--debug', '--colors', 'false', path.join(__dirname,'version.txt')]);
		unit.addExpect('STDOUT: '+pkg.version);
		unit.addExpect(/\✔\s+test\/version\.txt\s+\s\(\d+ms\)\s+should print out current version/);

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
