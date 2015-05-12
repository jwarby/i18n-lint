/**
 * hslint utils tests
 *
 * Copyright (c) 2015 James Warwood
 * Licensed under the MIT license.
 */
/* global describe, it */
/* jshint -W030 */
'use strict';

var expect = require('chai').expect;

var utils = require('../../lib/utils');

describe('hslint utils', function() {
  describe('isHardcodedString', function() {
    it('should return true for hardcoded strings', function() {
      var inputs = [
        'Something',
        'Something something something darkside',
        'Save...',
        'John\'s Page',
        'magical'
      ];

      inputs.forEach(function(input) {
        expect(utils.isHardcodedString(input)).to.be.true;
      });
    });

    it('should return false for non-hardcoded strings', function() {
      var inputs = [
        'a.translation.key',
        'a.key',
        'my.key'
      ];

      inputs.forEach(function(input) {
        expect(utils.isHardcodedString(input)).to.be.false;
      });
    });
  });

  describe('escapeRegExp', function() {
    it('should escape special characters', function() {
      var input = 'some(th)ing* not[ok]',
        expected = 'some\\(th\\)ing\\* not\\[ok\\]';

      expect(utils.escapeRegExp(input)).to.equal(expected);
    });
  });
});

