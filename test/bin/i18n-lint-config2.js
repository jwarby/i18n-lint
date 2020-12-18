/**
 * i18n-lint bin tests
 *
 * Copyright (c) 2020 Andrew Poblocki
 * Licensed under the MIT license.
 */
/* global describe, it */
'use strict';

var assert = require('assert');
var fs = require('fs');
var pkgDir = require('pkg-dir');
var exec = require('child_process').exec;
var path = require('path');

describe('i18n-lint bin config', function() {
  var cmd = 'node ' + path.join(__dirname, '../../bin/i18n-lint') + ' ';
  var configFileName = '.i18n-lint-2.json';
  var configFilePath = path.join(pkgDir.sync(), configFileName);

  before(function () {
    var config = {
      'include': [ '**/test/**/*.html', '**/*.html5' ],
      'exclude': [ '**/test_subdir/**', '**/1.html' ]
    };
    var configContent = JSON.stringify(config);

    fs.writeFileSync(configFilePath, configContent);    
  });

  after(function () {
    fs.unlinkSync(configFilePath);    
  });

  it('should read configuration file', function(done) {
    var command = cmd + ' --config ' + configFileName;
    
    exec(command, function(err, stdout, stderr) {
      assert.notStrictEqual(err, null);
      assert.strictEqual(err.code, 1);
      assert.strictEqual(stdout.indexOf('/test_subdir/'), -1);
      assert.strictEqual(stdout.indexOf('/1.html'), -1);
      assert.notStrictEqual(stdout.indexOf('html5'), -1);
      done();
    });
  });

});
