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

The following are the built-in commands that are supported:

- `ARG`: an argument to pass to CLI. can specific zero or more of these on separate lines.
- `CMD`: the path to the CLI binary (or if on your global $PATH, just the name)
- `DIR`: check existence of directory (precede with `!` to negate check)
- `DESC`: the test description, used in the results output
- `ECHO`: print to console a value
- `ERROR`: error message (or content from stderr if non-zero exit code).  can be string (exact match) or (regular expression)
- `EXEC`: execute a command.
- `EXIT`: exit code when the CLI exits
- `FILE`: check existence of file (precede with `!` to negate check)
- `FILE_SET`: set the value of a variable from contents of file
- `HTTP`: execute a HTTP request
- `HTTP_IN`: read body of previously fetched HTTP request
- `HTTP_OUT`: set body for a subsequent HTTP request
- `HTTP_HEADER`: read header from previously fetched HTTP request
- `HTTP_SET`: set a variable from HTTP header or body
- `IN`: input received from the CLI (stdout).  can be string (exact match) or regular expression
- `IN_SKIP`: skip to output that matches exact string or regular expression
- `MKDIR`: ensure directory is created and exists
- `OUT`: output to send the CLI (stdin). must be a string.
- `PLUGIN`: define a new plugin or plugin directory
- `RM`: delete file or directory
- `SET`: set a variable value
- `SLEEP`: sleep for milliseconds specified
- `SPAWN`: run without waiting another command
- `SPAWN_IN`: map spawn stdout to test `IN`
- `SPAWN_CWD`: set the working directory of `SPAWN`
- `SPAWN_KILL`: kill a running spawn process
- `SPAWN_WAIT`: wait for running spawn process to exit before continuing
- `SYMLINK`: make a symlink. arguments are current working directory, link file/directory and optional name
- `TOUCH`: ensure that a file exists


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


## Extending the Script

You can extend the script using plugins.  The plugin is a simple JS file that exports two primary properties: `command` (the name of the command) and `execute` (the function that handles execution of the plugin).

For example, a simple plugin:

```javascript
exports.command = 'FOO';
exports.execute = function(state, token, callback) {
    // do something and call callback when completed
    callback();
};
```

You can load it from within script:

```text
PLUGIN=./path/to/plugin.js
# now you can use it
FOO:bar
```
You can also load it from CLI as a plugin file or a directory of plugins:

```bash
cliunit --plugin ./path/to/plugin_or_dir script.txt
```


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
