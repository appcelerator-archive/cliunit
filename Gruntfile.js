module.exports = function(grunt) {

	// Project configuration.
	grunt.initConfig({
		env: {
			dev: {
			}
		},
		jshint: {
			options: {
				jshintrc: true
			},
			src: ['index.js', 'lib/**/*.js']
		},
		mochaTest: {
			options: {
				timeout: 3000,
				reporter: 'spec',
				ignoreLeaks: false,
				globals: ['_key']
			},
			src: 'test/*.js'
		},
		clean: ['tmp']
	});

	grunt.task.registerTask('test', 'Testing', function() {
		var spawn = require('child_process').spawn,
			fs = require('fs'),
			path = require('path'),
			_ = require('lodash'),
			bin = path.join(__dirname, 'bin', 'cliunit'),
			dir = path.join(__dirname, 'test'),
			env = _.merge(process.env, {GRUNT:1}),
			child = spawn(bin, [dir,'--colors','true','--config','a=b'], {env:env}),
			done = this.async();

		grunt.log.ok('running '+bin+' ...');
		grunt.log.writeln('');

		child.stdout.on('data',grunt.log.write);
		child.stderr.on('data',grunt.log.error);

		child.on('close',done);
	});


	// Load grunt plugins for modules
	grunt.loadNpmTasks('grunt-mocha-test');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-env');

	grunt.registerTask('default', ['clean', 'jshint', 'env', 'test', 'mochaTest']);

};
