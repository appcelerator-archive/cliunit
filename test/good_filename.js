var CLIUnit = require('../'),
    path = require('path'),
    pkg = require('../package.json');

describe("good_filename", function(){
    it("should be OK with a good script filename", function(done){
        var unit = new CLIUnit(__filename);
        unit.setBinary(path.join(__dirname,'../bin/cliunit'));
        unit.setArguments([path.join(__dirname,'./fixtures/test.txt')]);
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