var CLIUnit = require('../'),
    path = require('path'),
    pkg = require('../package.json');

describe("timeout", function(){
    it("should handle timeout", function(done){
        var unit = new CLIUnit(__filename);
        unit.setBinary(path.join(__dirname,'../bin/cliunit'));
        unit.setArguments(['--timeout',1,path.join(__dirname,'./fixtures/test.txt')]);
        unit.addExpect(/✘\s+test\/fixtures\/test\.txt\s+\(\dms\)/);
        unit.addExpect('Test Failure:');
        unit.addExpect('test/fixtures/test.txt');
        unit.addExpect(/timed out after \d ms/);
        unit.addExpect(/0 tests succeeded, 1 test failed/);
        function error(err) {
            done && done(err);
            done = null;
        }
        unit.on('timeout',error);
        unit.on('error',error);
        unit.on('finished', function(err,results){
            if (err!==1) {
                return error(new Error("expected exit code 1 but received "+err));
            }
            error();
        });
        unit.run();
    });
});
