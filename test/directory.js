var CLIUnit = require('../'),
	path = require('path'),
	pkg = require('../package.json');

describe("directory", function(){
	it("should be able to execute scripts in directory", function(done){
		var unit = new CLIUnit(__filename);
		unit.setBinary(path.join(__dirname,'../bin/cliunit'));
		unit.setArguments([path.join(__dirname,'./fixtures')]);
		unit.addExpect(/✔\s+test\/fixtures\/test\.txt\s+\(\dms\)/);
		unit.addExpect(/✔\s+test\/fixtures\/test2\.txt\s+\(\dms\)/);
		unit.addExpect(/✔\s+test\/fixtures\/test3\.txt\s+\(\dms\)/);
		unit.addExpect('3 tests succeeded!');
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
