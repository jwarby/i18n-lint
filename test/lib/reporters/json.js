/**
 * hslint json reporter tests
 *
 * Copyright (c) 2015 James Warwood
 * Licensed under the MIT license.
 */
/* global describe, it */
/* jshint -W030 */
'use strict';

var expect = require('chai').expect;
var fs = require('fs');
var hooker = require('hooker');
var stripAnsi = require('strip-ansi');

var reporter = require('../../../lib/reporters/json.js').reporter;

var errors = require('../../fixtures/errors/1.js')();

describe('hslint reporters json', function() {
  it('should format the output correctly', function(done) {
    var actual = '';

    hooker.hook(process.stdout, 'write', {
      pre: function(out) {
        actual += stripAnsi(out);

        return hooker.preempt();
      }
    });

    var expected = fs.readFileSync(
      __dirname + '/../../expected/reporters/json.txt'
    ).toString();

    // Execute method under test
    reporter(errors);

    hooker.unhook(process.stdout, 'write');
    expect(actual).to.equal(expected);

    // Test that valid json is output
    expect(JSON.stringify.bind(JSON, actual)).not.to.throw.error;

    done();
  });

  it('should not output anything if there are no errors', function(done) {
    var actual = '';

    hooker.hook(process.stdout, 'write', {
      pre: function(out) {
        actual += stripAnsi(out);

        return hooker.preempt();
      }
    });

    // Execute method under test
    reporter([]);

    hooker.unhook(process.stdout, 'write');
    expect(actual).to.equal('');

    done();
  });
});
