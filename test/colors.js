var CLIUnit = require('../'),
	path = require('path'),
	pkg = require('../package.json');

describe("colors", function(){
	it("should print out version using colors", function(done){
		var unit = new CLIUnit(__filename);
		unit.setBinary(path.join(__dirname,'../bin/cliunit'));
		unit.setArguments(['--debug', '--colors', 'true', path.join(__dirname,'version.txt')]);
		unit.addExpect('STDOUT: '+pkg.version);
		unit.addExpect(/\[32m✔\s+\[39m\[33mtest\/version\.txt\s+\[39m\[90m\s\(\dms\)\[39m\sshould print out current version/);

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
