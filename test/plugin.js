var CLIUnit = require('../'),
	path = require('path'),
	pkg = require('../package.json');

describe("plugin", function(){
	it("should test loading plugin as file", function(done){
		var unit = new CLIUnit(__filename);
		unit.setBinary(path.join(__dirname,'../bin/cliunit'));
		unit.setArguments(['--debug',path.join(__dirname,'./fixtures/plugins/test.txt'),'--plugin',path.join(__dirname,'./fixtures/plugins/goodplugin.js')]);

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
	it("should test loading plugin as directory", function(done){
		var unit = new CLIUnit(__filename);
		unit.setBinary(path.join(__dirname,'../bin/cliunit'));
		unit.setArguments([path.join(__dirname,'./fixtures/plugins/test.txt'),'--debug','--plugin',path.join(__dirname,'./fixtures/plugins/')]);
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
