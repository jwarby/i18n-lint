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

describe('i18n-lint bin config no files', function() {
  var cmd = 'node ' + path.join(__dirname, '../../bin/i18n-lint') + ' ';
  var configFileName = '.i18n-lint-1.json';
  var configFilePath = path.join(pkgDir.sync(), configFileName);

  before(function () {
    var config = {
      'templateDelimiters': [ ['{', '}'] ],
      'attributes': [ 'alt', 'placeholder', 'title', 'label', 'friendly-message' ],
      'ignoreTags': [ 'style', 'script', 'pre', 'code' ]
    };
    var configContent = JSON.stringify(config);

    fs.writeFileSync(configFilePath, configContent);    
  });

  after(function () {
    fs.unlinkSync(configFilePath);    
  });

  it('should fail if no files to scan are specified configuration file', function(done) {
    var command = cmd + ' --config ' + configFileName;

    exec(command, function(err, stdout, stderr) {
      assert.notStrictEqual(err, null);
      assert.strictEqual(err.code, 64);
      assert.notStrictEqual(-1, stdout.indexOf('No files specified'));

      done();
    });
  });  
});
