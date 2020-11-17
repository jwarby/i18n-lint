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

describe('i18n-lint bin config and param', function() {
  var cmd = 'node ' + path.join(__dirname, '../../bin/i18n-lint') + ' ';
  var configFileName = '.i18n-lint-3.json';
  var configFilePath = path.join(pkgDir.sync(), configFileName);

  before(function () {
    var config = {
      'include': ['test/**/1.html'],
    };
    var configContent = JSON.stringify(config);

    fs.writeFileSync(configFilePath, configContent);    
  });

  after(function () {
    fs.unlinkSync(configFilePath);    
  });

  it('should read configuration file and parameter', function(done) {
    var command = cmd + ' --config ' + configFileName;
    
    exec(command, function(err, stdout, stderr) {
      assert.strictEqual(err.code, 1);
      assert.notStrictEqual(stdout.indexOf('/1.html'), -1);
      done();
    });
  });

});
