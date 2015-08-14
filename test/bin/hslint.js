/**
 * i18n-lint bin tests
 *
 * Copyright (c) 2014 James Warwood
 * Licensed under the MIT license.
 */
/* global describe, it */
'use strict';

var assert = require('assert');
var exec = require('child_process').exec;
var path = require('path');

var pkg = require('../../package.json');

describe('i18n-lint bin', function() {
	var cmd = 'node ' + path.join(__dirname, '../../bin/i18n-lint') + ' ';

	it('--help should run without errors', function(done) {
		exec(cmd + '--help', function (error, stdout, stderr) {
			assert(!error);
			done();
		});
	});

	it('-h should run without errors', function(done) {
		exec(cmd + '-h', function (error, stdout, stderr) {
			assert(!error);
			done();
		});
	});

	it('--version should run without errors', function(done) {
		exec(cmd + '--version', function (error, stdout, stderr) {
      assert.notEqual(stdout.indexOf(pkg.version), -1);
			assert(!error);
			done();
		});
	});

	it('-V should run without errors', function(done) {
		exec(cmd + '-V', function (error, stdout, stderr) {
      assert.notEqual(stdout.indexOf(pkg.version), -1);
			assert(!error);
			done();
		});
	});

  it('should print error message and usage if no files provided', function(done) {
    exec(cmd, function(error, stdout, stderr) {
      assert.equal(error.code, 64);
      assert.notEqual(stdout.indexOf('No files'), -1);
      assert.notEqual(stdout.indexOf('Usage:'), -1);

      done();
    });
  });

  it('should print error message and fail if invalid reporter used', function(done) {
    exec(cmd + '-r invalidreporter test/fixtures/*.html', function(error, stdout, stderr) {
      assert.equal(error.code, 66);
      assert.notEqual(stderr.indexOf('No reporter called \'invalidreporter\''), -1);

      done();
    });
  });

  it('should exit with 1 if hardcoded strings are found', function(done) {
    exec(cmd + ' test/fixtures/1.html', function(error, stdout, stderr) {
      assert.equal(error.code, 1);
      done();
    });
  });

  it('should exit with 0 if no hardcoded strings are found', function(done) {
    exec(cmd + ' test/fixtures/clean.html', function(error, stdout, stderr) {
      assert(!error);
      done();
    });
  });

  it('should allow a built-in reporter to be specified', function(done) {
    exec(cmd + ' --reporter simple test/fixtures/1.html', function(error, stdout, stderr) {
      assert.equal(stderr.indexOf('No reporter called \'simple\''), -1);

      done();
    });
  });
});
