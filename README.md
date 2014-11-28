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

`CMD`: (required) the path to the CLI binary (or if on your global $PATH, just the name)
`ARG`: (optional) an argument to pass to CLI. can specific zero or more of these on separate lines.
`EXIT`: (optional) exit code when the CLI exits
`ERROR`: (optional) error message (or content from stderr if non-zero exit code).  can be string (exact match) or (regular expression)
`IN`: (optional) input received from the CLI (stdout).  can be string (exact match) or regular expression
`OUT`: (optional) output to send the CLI (stdin). must be a string.

For commands that accept a regular expression you must specify a `/` at the beginning and `/` at the end of the input.  For example:

```text
IN:/\d\.\d\.\d/
```
Would match a version such as 0.0.0 in the stdout of the CLI binary.

### Passing parameters to scripts

You can parameterize your scripts.  For example, if you want to dynamically pass in certain values (like a password) to your script from a config file or from the console.  Each script is processed as [EJS](https://github.com/tj/ejs) before execution.  Configuration comes from the `--config` command line option.  You can pass one or more key/value pairs in your option to have them passed into your scripts.

For example:

```bash
$ cliunit ./test --option "username=test,password=foobar"
```

In your script, for example, you could use:

```text
IN:? username: 
IN:<%=username%>
IN:? password: 
OUT:<%=password%>
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

See the `lib/cliunit.js` file for information on the APIs supported.


# License

Licensed under the Apache Public License, version 2.
