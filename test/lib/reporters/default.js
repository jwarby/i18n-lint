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

var expect = require('chai').expect;
var errors = require('../../fixtures/errors/1.js')();
var fs = require('fs');
var hooker = require('hooker');
var stripAnsi = require('strip-ansi');

var reporter = require('../../../lib/reporters/default.js');

describe('hslint reporters default', function() {
  it('should format the output correctly', function(done) {
    var actual = '';

    hooker.hook(process.stdout, 'write', {
      pre: function(out) {
        actual += stripAnsi(out);

        return hooker.preempt();
      }
    });

    var expected = fs.readFileSync(
      __dirname + '/../../expected/reporters/default.txt'
    ).toString();

    // Execute method under test
    try {
      reporter(errors);
    } catch(e) {
      hooker.unhook(process.stdout, 'write');
      console.log(e);
      console.log(e.stack);
    }

    hooker.unhook(process.stdout, 'write');
    expect(actual).to.equal(expected);

    done();
  });

  it('should handle tabs appropriately', function(done) {
    var actual = '';
    var errors = require('../../fixtures/errors/tabbed.js');

    hooker.hook(process.stdout, 'write', {
      pre: function(out) {
        actual += stripAnsi(out);

        return hooker.preempt();
      }
    });

    var expected = fs.readFileSync(
      __dirname + '/../../expected/reporters/default_tabbed.txt'
    ).toString();

    // Execute method under test
    reporter(errors);

    hooker.unhook(process.stdout, 'write');
    expect(actual).to.equal(expected);

    done();
  });

  it('should new lines appropriately', function(done) {
    var actual = '';
    var errors = require('../../fixtures/errors/new_lines.js');

    hooker.hook(process.stdout, 'write', {
      pre: function(out) {
        actual += stripAnsi(out);

        return hooker.preempt();
      }
    });

    var expected = fs.readFileSync(
      __dirname + '/../../expected/reporters/default_new_lines.txt'
    ).toString();

    // Execute method under test
    reporter(errors);

    hooker.unhook(process.stdout, 'write');
    expect(actual).to.equal(expected);

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

    // Execute
    reporter([]);

    hooker.unhook(process.stdout, 'write');

    done();
  });

  it('should be able to handle regex evidence', function(done) {
    var errors = require('../../fixtures/errors/regex_evidence.js');
    var expected = fs.readFileSync(
      __dirname + '/../../expected/reporters/default_string_evidence.txt'
    );
    var actual = '';

    hooker.hook(process.stdout, 'write', {
      pre: function(out) {
        actual += stripAnsi(out);

        return hooker.preempt();
      }
    });

    reporter(errors);

    hooker.unhook(process.stdout, 'write');

    expect(actual).to.equal(expected.toString());

    done();
  });

  it('should handle content which contains parentheses', function(done) {
    var errors = require('../../fixtures/errors/parentheses_evidence.js')();
    var actual = '';

    hooker.hook(process.stdout, 'write', {
      pre: function(out) {
        actual += stripAnsi(out);

        return hooker.preempt();
      }
    });

    expect(reporter.bind(reporter, errors)).to.not.throw(SyntaxError);

    hooker.unhook(process.stdout, 'write');

    expect(actual).to.not.have.string('\\(');

    done();
  });
});
