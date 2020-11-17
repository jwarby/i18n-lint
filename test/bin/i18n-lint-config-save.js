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

describe('i18n-lint bin config initialize', function() {
  var cmd = 'node ' + path.join(__dirname, '../../bin/i18n-lint') + ' ';
  var configName = '.i18n-lint-test.json';
  var configFilePath = path.join(pkgDir.sync(), configName);

  before(function () {
    if (fs.existsSync(configFilePath)) {
      fs.unlinkSync(configFilePath);
    }
  });

  after(function () {
    fs.unlinkSync(configFilePath);
  });

  it('should read generate a configuration file', function(done) {
    var command = cmd + ' --init --config ' + configName + ' \'**/*.html\'';
    
    exec(command, function(err, stdout, stderr) {
      assert.strictEqual(err, null);      
      assert.equal(fs.existsSync(configFilePath), true);

      var data = fs.readFileSync(configFilePath);

      var config = JSON.parse(data);

      assert.deepStrictEqual(config,  
        {
          'attributes': [
            'alt',
            'placeholder',
            'title'
          ],
          'color': true,
          'exclude': [],
          'ignoreTags': [
            'style',
            'script',
            'pre',
            'code'
          ],
          'include': [
            '**/*.html'
          ],
          'templateDelimiters': [
            [
              '{',
              '}'
            ]
          ]
        });
      
      done();
    });
  });

});
