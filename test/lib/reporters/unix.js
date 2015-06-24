/**
 * hslint default reporter tests
 *
 * @TODO make stdout hooking DRY
 *
 * Copyright (c) 2014 James Warwood
 * Licensed under the MIT license.
 */
/* global describe, it */
'use strict';

// Core imports
var fs = require('fs');

// npm imports
var expect = require('chai').expect;
var hooker = require('hooker');

// Local imports
var errors = require('../../fixtures/errors/1.js')();
var reporter = require('../../../lib/reporters/unix.js');

describe('hslint reporters unix', function() {
  it('should format the output correctly', function() {

    // Setup
    var actual = '';

    hooker.hook(process.stdout, 'write', {
      pre: function(out) {
        actual += out;

        return hooker.preempt();
      }
    });

    var expected = fs.readFileSync(__dirname +
        '/../../expected/reporters/unix.txt').toString();

    // Execute
    reporter(errors);
    hooker.unhook(process.stdout, 'write');

    // Assert
    expect(actual).to.equal(expected);
  });

  it('should not output anything if there are no errors', function() {
    var actual = '';

    hooker.hook(process.stdout, 'write', {
      pre: function(out) {
        actual += out;

        return hooker.preempt();
      }
    });

    // Execute
    reporter([]);

    hooker.unhook(process.stdout, 'write');

  });
});
