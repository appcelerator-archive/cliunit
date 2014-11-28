var CLIUnit = require('../'),
    path = require('path'),
    pkg = require('../package.json');

describe("help_wo_flag", function(){
    it("should be able to print help with no arguments", function(done){
        var unit = new CLIUnit(__filename);
        unit.setBinary(path.join(__dirname,'../bin/cliunit'));
        unit.addExpect('  Usage: cliunit [options]');
        unit.addExpect('  Options:');
        unit.addExpect('    -h, --help           output usage information');
        unit.addExpect('    -V, --version        output the version number');
        unit.addExpect('    --debug              print debug output');
        unit.addExpect('    --config <config>    pass configuration into script as key=value');
        unit.addExpect('    --timeout <timeout>  timeout in ms before test should be aborted');
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
