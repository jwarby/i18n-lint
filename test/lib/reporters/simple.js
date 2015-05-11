/**
 * hslint simple reporter tests
 *
 * Copyright (c) 2015 James Warwood
 * Licensed under the MIT license.
 */
/* global describe, it */
'use strict';

var expect = require('chai').expect;
var fs = require('fs');
var hooker = require('hooker');
var stripAnsi = require('strip-ansi');

var reporter = require('../../../lib/reporters/simple.js').reporter;

var data = require('../../fixtures/errors/1.js')();

describe('hslint reporters simple', function() {
  it('should format the output correctly', function(done) {
    var actual = '';

    hooker.hook(process.stdout, 'write', {
      pre: function(out) {
        actual += stripAnsi(out);

        return hooker.preempt();
      }
    });
    var expected = fs.readFileSync(
      __dirname + '/../../expected/reporters/simple.txt'
    ).toString();

    // Execute method under test
    reporter(data);

    expect(actual).to.equal(expected);
    hooker.unhook(process.stdout, 'write');

    done();
  });
});
