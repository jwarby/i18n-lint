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
    exec(cmd + ' --reporter unix test/fixtures/1.html', function(error, stdout, stderr) {
      assert.equal(stderr.indexOf('No reporter called \'unix\''), -1);

      done();
    });
  });

  it('should allow a custom reporter to be used', function(done) {
    exec(
      cmd + ' --reporter test/fixtures/sample-reporter.js test/fixtures/1.html',
      function(err, stdout, stderr) {
        assert.strictEqual(true, stdout.endsWith('Found 3 errors\n'));

        done();
      }
    );
  });

  it('-i, --ignore-tags option should work as expected', function(done) {
    var args = [
      ' -i "h1,a" test/fixtures/testing.html',
      ' --ignore-tags "h1,a" test/fixtures/testing.html',
    ];

    args.forEach(function(arg, i) {
      exec(cmd + arg, function(err, stdout, stderr) {
        assert.equal(stdout.indexOf('Hardcoded <h1> tag'), -1);
        assert.equal(stdout.indexOf('Hardcoded <a> tag'), -1);
        assert.notEqual(stdout.indexOf('Hardcoded <p> tag'), -1);

        if (i === args.length -1) {
          done();
        }
      });
    });
  });

  it('-t, --template-delimiters option should work as expected', function(done) {
    var args = [
      ' -t "{{,}}" test/fixtures/testing.hbs',
      ' --template-delimiters "{{,}}" test/fixtures/testing.hbs',
    ];

    args.forEach(function(arg, i) {
      exec(cmd + arg, function(err, stdout, stderr) {
        assert.equal(stdout.match(/Hardcoded <(h4|span|button)> tag/g).length, 3);

        if (i === args.length -1) {
          done();
        }
      });
    });
  });

  it('-t, --template-delimiters option with multiple delimiters', function(done) {
    var args = [
      ' -t "{{,}}" -t "{%,%}" test/fixtures/testing.twig',
      ' --template-delimiters "{{,}}" --template-delimiters "{%,%}" test/fixtures/testing.twig',
    ];

    args.forEach(function(arg, i) {
      exec(cmd + arg, function(err, stdout, stderr) {
        assert.equal(stdout.match(/Hardcoded <(h1|span|li)> tag/g).length, 3);

        if (i === args.length - 1) {
          done();
        }
      });
    });
  });

  it('-a, --attributes option should work as expected', function(done) {
    var args = [
      ' -a "title" test/fixtures/multi_instance.html',
      ' --attributes "title" test/fixtures/multi_instance.html',
    ];

    args.forEach(function(arg, i) {
      exec(cmd + arg, function(err, stdout, stderr) {
        assert.equal(stdout.indexOf('Hardcoded \'alt\' attribute'), -1);
        assert.notEqual(stdout.indexOf('Hardcoded \'title\' attribute'), -1);

        if (i === args.length -1) {
          done();
        }
      });
    });
  });

  it('should support piping', function(done) {
    var command = 'cat test/fixtures/testing.html | ' + cmd;

    exec(command, function(err, stdout, stderr) {
      assert.equal(err.code, 1);

      assert.equal(stdout.match(/Hardcoded/g).length, 10);

      command += ' --ignore-tags \'p\'';

      exec(command, function(err, stdout, stderr) {
        assert.equal(err.code, 1);

        assert.equal(stdout.match(/Hardcoded/g).length, 8);
        done();
      });
    });
  });

  it('should support piping using \'-\' argument', function(done) {
    var command = 'cat test/fixtures/testing.html | ' + cmd + ' -';

    exec(command, function(err, stdout, stderr) {
      assert.equal(err.code, 1);

      assert.equal(stdout.match(/Hardcoded/g).length, 10);

      command += ' --ignore-tags \'p\'';

      exec(command, function(err, stdout, stderr) {
        assert.equal(err.code, 1);

        assert.equal(stdout.match(/Hardcoded/g).length, 8);
        done();
      });
    });
  });

  it('should support stdin redirection', function(done) {
    var command = cmd + ' < test/fixtures/testing.html';

    exec(command, function(err, stdout, stderr) {
      assert.equal(err.code, 1);

      assert.equal(stdout.match(/Hardcoded/g).length, 10);

      command = cmd + ' --ignore-tags \'p\' < test/fixtures/testing.html';

      exec(command, function(err, stdout, stderr) {
        assert.equal(err.code, 1);
        assert.equal(stdout.match(/Hardcoded/g).length, 8);
        done();
      });
    });
  });

  it('should warn and exit if file does not exist', function(done) {
    var command = cmd + ' nonexistent.html';

    exec(command, function(err, stdout, stderr) {
      assert.notEqual(err, null);
      assert.equal(err.code, 66);

      assert.equal(stderr, 'i18n-lint: nonexistent.html: No such file or directory\n');
      done();
    });
  });

  it('should play nicely with xargs', function(done) {
    var command = 'echo test/fixtures/testing.html test/fixtures/1.html | xargs ' + cmd;

    exec(command, function(err, stdout, stderr) {

      // xargs exit code if invocation fails
      assert.equal(err.code, 1);

      assert.equal(stdout.match(/\^ Hardcoded/g).length, 13);

      done();
    });
  });

  it('should allow files to be ignored using --exclude', function(done) {
    var command = cmd + ' test/**/*.html --exclude test_subdir/,1.html';

    exec(command, function(err, stdout, stderr) {
      assert.equal(stdout.indexOf('/test_subdir/'), -1);
      assert.equal(stdout.indexOf('/1.html'), -1);
      done();
    });
  });

  it('should output appropriate warning if a directory is specified as input', function(done) {
    var command = cmd + ' test/';

    exec(command, function(err, stdout, stderr) {

      assert.notEqual(err, null);
      assert.equal(err.code, 64);

      assert.equal(stderr, 'i18n-lint: test/: is a directory\n');

      done();
    });
  });
});
