# CLI Unit Test

CLIUnit is a unit testing framework for command line programs.  It's meant to be easy to script with simple text files but powerful enough with a programatic API.


# Installation

```bash
$ [sudo] npm install cliunit --global
```

# Usage

CLIUnit can be used similar to [Mocha](https://github.com/mochajs/mocha).  You can point at a specific file or a directory of files.  The file extension should be `.txt`.

For example, to run a specific test file named `foobar.txt`, you might use:

```bash
$ cliunit ./test/foobar.txt
```

Or you could run all tests from the `test` directory:

```bash
$ cliunit ./test
```

You can pass in `--debug` to print out the CLI stdout and stderr to aid in building or testing scripts.

# Authoring tests

## Using a test file

Any `#` or blank space will be ignore in the test file.

The basic format is `COMMAND:ARGUMENT`.  Beginning and trailing space is preserved so make sure you pay attention to your spacing.

The following are basic commands:

- `DESC`: (optional) the test description, used in the results output
- `CMD`: (required) the path to the CLI binary (or if on your global $PATH, just the name)
- `ARG`: (optional) an argument to pass to CLI. can specific zero or more of these on separate lines.
- `EXIT`: (optional) exit code when the CLI exits
- `ERROR`: (optional) error message (or content from stderr if non-zero exit code).  can be string (exact match) or (regular expression)
- `IN`: (optional) input received from the CLI (stdout).  can be string (exact match) or regular expression
- `OUT`: (optional) output to send the CLI (stdin). must be a string.

For commands that accept a regular expression you must specify a `/` at the beginning and `/` at the end of the input.  For example:

```text
IN:/\d\.\d\.\d/
```
Would match a version such as 0.0.0 in the stdout of the CLI binary.

### Passing parameters to scripts

You can parameterize your scripts.  For example, if you want to dynamically pass in certain values (like a password) to your script from a config file or from the console.  Each script is processed as [EJS](https://github.com/tj/ejs) before execution.  Configuration comes from the `--config` command line option.  You can pass one or more key/value pairs in your option to have them passed into your scripts.

For example:

```bash
$ cliunit ./test --config "username=test,password=foobar"
```

In your script, for example, you could use:

```text
IN:? username: 
IN:<%=username%>
IN:? password: 
OUT:<%=password%>
```

For a good set of examples, CLIUnit itself is unit tested with itself (recursive?).  Check out the [`test`](https://github.com/appcelerator/cliunit/tree/master/test) directory in this project for various examples.

## Using the API

Instead of using the CLIUnit cli, you could use the API.

```javascript
var CLIUnit = require('cliunit'),
    unit = new CLIUnit();

unit.setBinary('mybin');
unit.setArguments(['--debug','foo']);
unit.addExpect('? username: ', 'foo');
unit.addExpect('? password: ', 'bar');
unit.on('error',function(err){
    console.error(err);
});
unit.on('finished',function(exitCode){
    console.log('finished',exitCode);
    console.log('timed out',unit.didTimeout());
});
unit.on('stdout',function(buf){
    console.log('STDOUT:',buf);
});
unit.on('stderr',function(buf){
    console.log('STDERR:',buf);
});
unit.run();
```

See the `lib/cliunit.js` file for information on the APIs supported or JS versions of the tests for this program under [`tests`](https://github.com/appcelerator/cliunit/tree/master/test).


## Contributing

CLIUnit is an open source project.  Please consider forking this repo to improve, enhance or fix issues. If you feel like the community will benefit from your fork, please open a pull request.

To protect the interests of the contributors, Appcelerator, customers and end users we require contributors to sign a Contributors License Agreement (CLA) before we pull the changes into the main repository. Our CLA is simple and straightforward - it requires that the contributions you make to any Appcelerator open source project are properly licensed and that you have the legal authority to make those changes. This helps us significantly reduce future legal risk for everyone involved. It is easy, helps everyone, takes only a few minutes, and only needs to be completed once.

[You can digitally sign the CLA](http://bit.ly/app_cla) online. Please indicate your email address in your first pull request so that we can make sure that will locate your CLA.  Once you've submitted it, you no longer need to send one for subsequent submissions.

## Contributors

The original author for this was [Jeff Haynie](https://github.com/jhaynie).

# Legal

Copyright (c) 2014 by [Appcelerator, Inc](http://www.appcelerator.com). All Rights Reserved.
This project is licensed under the Apache Public License, version 2.  Please see details in the LICENSE file.
