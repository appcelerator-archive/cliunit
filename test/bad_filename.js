var CLIUnit = require('../'),
    path = require('path'),
    pkg = require('../package.json');

describe("bad_filename", function(){
    it("should print out correct error on bad filename", function(done){
        var unit = new CLIUnit(__filename);
        unit.setBinary(path.join(__dirname,'../bin/cliunit'));
        unit.setArguments(['fppbar']);
        unit.addExpect(/Couldn't find script:\s(.*)\/fppbar$/);

        function error(err) {
            done && done(err);
            done = null;
        }
        unit.on('timeout',error);
        unit.on('error',error);
        unit.on('finished', function(err,results){
            if (err!==1) {
                return error(new Error("should have exited with exit code 1"));
            }
            error();
        });
        unit.run();
    });
});
