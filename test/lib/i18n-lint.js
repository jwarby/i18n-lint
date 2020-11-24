/**
 * I18nLint lib tests
 *
 * Copyright (c) 2015 James Warwood
 * Licensed under the MIT license.
 */
/* global describe, it */
/* jshint -W030 */
'use strict';
var path = require('path');

var expect = require('chai').expect;

var I18nLint = require('../../');

var MESSAGES = {
  text: /Hardcoded <.*?> tag/,
  attr: /Hardcoded .*? attribute/
};

describe('I18nLint lib', function() {
  it('should throw an error if no filename provided', function() {
    try {
      var error = path.join();
      expect(I18nLint).to.throw(TypeError, error.message);
    } catch (e) {}
  });

  it('should return errors in the proper format', function() {
    var error = I18nLint('test/fixtures/testing.html').pop(),
      expectedDetails = {
        id: 'string',
        code: 'string',
        reason: 'string',
        evidence: 'regexp',
        line: 'number',
        character: 'number',
        scope: 'string'
      };

    Object.keys(expectedDetails).forEach(function(property) {
      expect(error)
        .to.have.property(property)
        .that.is.a(expectedDetails[property]);
    });

  });

  it('should produce accurate error report', function() {
    var error = I18nLint('test/fixtures/testing.html').pop(),
      expected = require('../expected/error.js');

    expect(error).to.deep.equal(expected);

  });

  it('should produce correct output for default options', function() {
    var errors = I18nLint('test/fixtures/testing.html');

    expect(errors).to.have.length(10);

    expect(
      errors.filter(function(error) {
        return MESSAGES.text.test(error.reason);
      })
    ).to.have.length(9);

  });

  it('should produce correct output for custom options', function() {
    var errors = I18nLint('test/fixtures/testing.html', {
      attributes: []
    });

    expect(errors).to.have.length(9);

    expect(
      errors.filter(function(error) {
        return MESSAGES.attr.test(error.reason);
      })
    ).to.be.empty;

  });

  it('should report line numbers correctly', function() {
    var errors = I18nLint('test/fixtures/testing.html');

    expect(
      errors.map(function(error) {
        return error.line;
      })
    ).to.have.members([6, 7, 8, 8, 8, 9, 9, 9, 12, 13]);

  });

  it('should handle templated content correctly', function() {

    // Test with EJS-style delimiters, <% and %>
    expect(
      I18nLint('test/fixtures/testing.ejs', {
        templateDelimiters: [['<%', '%>']]
      })
    ).to.have.length(4);

    // Test with Mustache-style delimiters, {{ and }}
    expect(
      I18nLint('test/fixtures/testing.hbs', {
        templateDelimiters: [['{{', '}}']]
      })
    ).to.have.length(3);

    // Test with multiple delimiters
    expect(
      I18nLint('test/fixtures/testing.twig', {
        templateDelimiters: [['{{', '}}'], ['{%', '%}']]
      })
    ).to.have.length(3);

    // Test with a wrong sized delimiter
    expect(
      I18nLint('test/fixtures/testing.twig', {
        templateDelimiters: [['{{'], ['{%', '%}']]
      })
    ).to.have.length(3);

  });

  it('should support legacy single-depth array in `templateDelimiters` option', function() {
    expect(
      I18nLint('test/fixtures/testing.ejs', {
        templateDelimiters: ['<%', '%>']
      })
    ).to.have.length(4);
  });

  it('should return empty array for clean file', function() {
    var errors = I18nLint('test/fixtures/clean.hbs', {
      templateDelimiters: [['{{', '}}']]
    });

    expect(errors).to.be.empty;

  });

  it('should handle text nodes split over multiple lines', function() {
    var errors = I18nLint('test/fixtures/multiline_text_node.hbs', {
      templateDelimiters: [['{{', '}}']]
    });

    expect(errors).to.have.length(2);

    expect(errors[1])
      .to.have.property('reason')
      .to.include('(continued)');

    // Second test case
    errors = I18nLint('test/fixtures/multiline_text_node_2.hbs');
    expect(errors).to.have.length(1);
    expect(errors[0])
      .to.have.property('line').that.equals(11);

  });

  it ('should handle a text node with templated content', function() {
    var errors = I18nLint('test/fixtures/text_node_with_template_content.ejs', {
      templateDelimiters: [['<%', '%>']]
    });

    expect(errors).to.have.length(1);
    expect(errors[0])
      .to.have.property('reason').to.match(MESSAGES.text);

  });

  it('should handle attributes with templated content', function() {
    var errors = I18nLint('test/fixtures/attribute_with_template_content.ejs', {
      templateDelimiters: [['<%', '%>']]
    });

    expect(errors).to.have.length(1);
    expect(errors[0]).to.have.property('scope').to.contain(
      '<h5 alt="Showing <%= count %> of <%= total %> comments">'
    );
    expect(errors[0])
      .to.have.property('reason')
        .that.equals('Hardcoded \'alt\' attribute');

  });

  it('should escape RegExp characters in source strings', function() {
    expect(
      function() {
        I18nLint('test/fixtures/regex_escaping.html');
      }
    ).not.to.throw(SyntaxError);

  });

  it('should ignore tags specified in `ignoreTags`', function() {

    // Test with default options
    var errors = I18nLint('test/fixtures/script_tag.html');

    expect(errors).to.have.length(1);

    expect(errors[0]).to.have.property('line').that.equals(2);

    // Test with custom options
    errors = I18nLint('test/fixtures/ignore_tags_option.html', {
      ignoreTags: ['pre', 'script']
    });

    expect(errors).to.have.length(0);
  });

  it('should handle unicode in input', function() {
    var errors = I18nLint('test/fixtures/unicode.html');

    expect(errors).to.have.length(2);

    expect(
      errors.filter(function(error) {
        return error.reason === 'Hardcoded <p> tag';
      }).pop()
    ).to.have.property('scope').to.match(/©/);

  });

  it('should catch hardcoded strings with ... ellipsis', function() {
    var errors = I18nLint('test/fixtures/ellipsis_translation.ejs', {
      templateDelimiters: [['<%', '%>']]
    });

    expect(errors).to.have.length(1);

    expect(errors[0])
      .to.have.property('evidence')
      .to.satisfy(function(regex) {
        return regex.toString().indexOf('should\\.\\.\\.') !== -1;
      });

  });

  it('should handle Windows line endings', function() {
    var errors = I18nLint('test/fixtures/windows_line_endings.html');

    expect(errors).to.have.length(3);

  });

  it('should get correct scope when offending text appears twice', function() {
    var expected = [{
        line: 1,
        character: 24
      }, {
        line: 3,
        character: 17
      }, {
        line: 3,
        character: 33
      }, {
        line: 5,
        character: 11
      }],
      errors = I18nLint('test/fixtures/multi_instance.html');

    expect(errors).to.have.length(expected.length);

    expected.forEach(function(e, index) {
      Object.keys(e).forEach(function(key) {
        expect(errors[index])
          .to.have.property(key).that.equals(expected[index][key]);
      });
    });

  });

  it('should handle invalid HTML', function() {
    var expected = [{
        line: 2,
        character: 183
      }, {
        line: 3,
        character: 170
      }],
      errors = I18nLint('test/fixtures/invalid_html.html');

    expect(errors).to.have.length(expected.length);

    expected.forEach(function(e, index) {
      Object.keys(e).forEach(function(key) {
        expect(errors[index])
          .to.have.property(key).that.equals(expected[index][key]);
      });
    });

  });

  it('should handle multiple instances of exactly the same tag/contents', function() {
    var expected = [{
        line: 2,
        character: 6
      }, {
        line: 4,
        character: 5
      }, {
        line: 7,
        character: 6
      }, {
        line: 9,
        character: 5
      }],
      errors = I18nLint('test/fixtures/repeated_tags.html');

    expect(errors).to.have.length(expected.length);

    expected.forEach(function(e, index) {
      Object.keys(e).forEach(function(key) {
        expect(errors[index])
          .to.have.property(key).that.equals(expected[index][key]);
      });
    });

  });

  it('should handle cases where a tag\'s content does not start until the next line', function() {
    var errors = I18nLint('test/fixtures/newline_tag.html');

    expect(errors).to.have.length(1);

  });

  it('should handle tags inside other tags', function() {
    var errors = I18nLint('test/fixtures/tag_within_tag.html');

    expect(errors).to.have.length(1);

  });

  it('should handle attributes on new lines', function() {
    var errors = I18nLint('test/fixtures/attribute_new_lines.html');

    expect(errors).to.have.length(2);

  });

  it('should handle content in brackets', function() {
    var errors = I18nLint('test/fixtures/brackets.html');

    expect(errors).to.have.length(1);

    expect(errors.pop()).to.have.a.property('line').that.is.a('number');

  });

  it('should handle mixed quotes', function() {
    var errors = I18nLint.bind(I18nLint, 'test/fixtures/mixed_quotes.html');

    expect(errors).not.to.throw(TypeError);

    expect(errors).to.have.length(1);

  });

  it(
    'should report correct character when offending text already appears in tag string',
    function() {
      var errors = I18nLint('test/fixtures/repeated.html');

      expect(errors).to.have.length(2);

      expect(errors[0])
        .to.have.a.property('character')
        .that.equals(140)
      ;

      expect(errors[1])
        .to.have.a.property('character')
        .that.equals(97)
      ;
    }
  );

  it('should report content not in tags as hardcoded text nodes', function() {
    var errors = I18nLint('test/fixtures/no_tag.html');

    expect(errors[0])
      .to.have.a.property('reason')
      .that.equals('Hardcoded text node')
    ;

  });

  it('should strip Windows new line characters from end of scope', function() {
    var errors = I18nLint('test/fixtures/windows_line_endings.html');

    errors.forEach(function(error) {
      expect(error.scope)
        .not.to.have.string('\r')
      ;
    });

  });

  it('should handle content separated by other content within parentheses', function() {
    var errors = I18nLint('test/fixtures/parentheses.html');

    expect(errors)
      .to.have.length(3)
    ;

    expect(errors[0].evidence.toString())
      .to.equal('/(Add favourite).*?(by page)/')
    ;
  });

  it('should ignore HTML entities', function() {
    var errors = I18nLint('test/fixtures/html_entities.html');

    expect(errors).to.be.empty;

  });

  it('should handle upper-cased tags and attributes', function() {
    var errors = I18nLint('test/fixtures/uppercase_tags_attrs.html');

    expect(errors)
      .to.have.length(2)
    ;

    expect(errors[0])
      .to.have.property('reason')
      .that.equals('Hardcoded \'title\' attribute')
    ;

    expect(errors[1])
      .to.have.property('reason')
      .that.equals('Hardcoded <span> tag')
    ;

  });

  it('should report split strings not in a tag as a single error', function() {
    var errors = I18nLint('test/fixtures/no_tag_same_line.html');

    expect(errors).to.have.length(1);

    expect(errors[0].evidence.toString())
      .to.equal('/(Favorite button).*?(by page\'s title\\.)/')
    ;

    errors = I18nLint('test/fixtures/no_tag_multi_line.html');

    expect(errors).to.have.length(2);

    expect(errors[0].evidence.toString())
      .to.equal('/(Click on the)/')
    ;

    expect(errors[1].evidence.toString())
      .to.equal('/(Favorite button).*?(by page\'s title\\.)/')
    ;

    expect(errors[1])
      .to.have.a.property('reason')
      .that.equals('Hardcoded text node (continued)')
    ;
  });

  it('should handle attributes which are split across multiple lines', function() {
    var errors = I18nLint('test/fixtures/multiline_attribute.html');

    expect(errors).to.have.length(2);

    expect(errors[0])
      .to.have.a.property('reason')
      .that.equals('Hardcoded \'title\' attribute')
    ;
  });

  it('reports when error on last line and no newline at EOF', function() {
    var errors = I18nLint('test/fixtures/last_line_error_no_newline_at_eof.html');

    expect(errors).to.have.length(1);
  });

  it('should handle attributes that are not enclosed', function() {
    var errors = I18nLint('test/fixtures/lwc.html', 
        { attributes: ['alt', 'placeholder', 'title', 'label', 'alternative-text', 'text'],
          templateDelimiters: [['{','}']],
          ignoreTags: ['style', 'script', 'pre', 'code']
      });

    expect(errors).to.have.length(0);
  });  
});

