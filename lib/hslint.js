/**
 * hslint
 *
 * Scans a HTML-like file to find text nodes and attributes whose values look
 * like hardcoded strings, i.e. untranslated text which is not using an i18n
 * system.
 *
 * It feeds the source file line-by-line into a HTML parser, so that the line
 * number and tag can be kept track of for accurate error reporting.
 *
 * Copyright (c) 2014 James Warwood
 * Licensed under the MIT license.
 */
'use strict';

// Core dependencies
var fs = require('fs');

// npm dependencies
var extend = require('node.extend');
var htmlparser = require('htmlparser2');

/**
 * Determine whether or not `str` is a hardcoded string
 *
 * @param {String} str  The string to test
 *
 * @return {Boolean} true if the string is classed as a hardcoded string,
 *                   false otherwiser
 */
var isHardcodedString = function(str) {
  str = str ? str.trim() : null;

  if (!str) {
    return false;
  }

  // Single, all lowercase words with no single dots
  if (/^([a-z!\?]|[ ]){2,}?(?:[.]{2,})?$/.test(str)) {
    return true;
  }

  // Probably a hardcoded string if it contains spaces or a captial letter
  return /(?=.*[A-Z])(?=.* *)/.test(str);
};

/**
 * hslint
 *
 * Errors are reported in the following format:
 *
 *    {
 *      file: '', // string, file which contains the errors,
 *      error: {
 *        id: String, // usually '(error)'
 *        code: String, // warning code (see Warning Numbers)
 *        reason: String, // message describing the error
 *        evidence: RegExp, // with the offending text in match groups
 *        line: Number, // line number of the error
 *        character: Number, // column where evidence begins
 *        scope: String // where the error was found
 *      }
 *    }
 *
 * @param {String} file     File to lint
 * @param {Object} options  Options for linting
 *
 * @return {[Object]} an array of error objects
 */
var hslint = function(file, options) {

  // Extend options with defaults
  options = extend({
    attributes: ['title', 'alt'],
    ignoreTags: ['script', 'style', 'pre'],
    templateDelimiters: []
  }, options);

  var errors = [];

  // Current state variables - line number and tags
  var state = {
    lineNumber: 0,
    tagStack: []
  };

  // Helper function for viewing last item on stack non-destructively
  state.tagStack.last = function() {
    return this[this.length - 1];
  };

  // Read the original file as an array of lines
  var lines = fs.readFileSync(file).toString().split('\n');

  /* Keep a list of the original lines.  We will replacing matched substrings in
   * each entry of the `lines` list with garbage, so that we can correctly
   * identify similar substrings on the same line should they occur.
   *
   * An example of such a situation is:
   *
   *   <a href="#" title="Save the item">Save</a>
   *
   * In the above, 'Save the item' will be replace so it doesn't intefere when
   * we try to match 'Save' and find it's column number.
   */
  var originalLines = lines.slice(0);

  // Template for reported errors
  var errorTemplate = {

    // File the error was found in.  Shouldn't be changed
    file: file,

    // Details of the error
    error: {

      // Placeholder id
      id: '(error)',

      // Code, e.g. W001 or W002
      code: '',

      // Description of the problem
      reason: '',

      // Regex identifying the error within `scope` (below)
      evidence: null,

      // Line number of the error within `file`
      line: -1,

      // Column number within `line`
      character: -1,

      // Contents of `line` from source file
      scope: ''
    }
  };

  var parser = new htmlparser.Parser({
    /**
     * When a new tag is opened, add it to the stack.  Account for template
     * delimiters which begin with '<' as htmlparser2 will pick them up as tags,
     * whereas they should be ignored.
     *
     * @param {String} name   The tag name, such as 'p'
     * @param {Object} attrs  An attribute/value key pairs object
     */
    onopentag: function(name, attrs) {

      /* @todo tidy up
       * Account for template delimiters which begin with '<' (such as EJS) -
       * htmlparser2 picks them up as tags
       */
      if (options.templateDelimiters.length === 2) {
        if (name.indexOf(options.templateDelimiters[0].slice(1)) === 0) {
          return;
        }
      }

      // Add to the stack
      state.tagStack.push({
        name: name,
        error: null // Will be used to indicate if an error is a continuation
      });
    },
    /**
     * When a new text node is encountered, check if it's text is a hardcoded
     * string.  If it is, add it as an error.  If an error has already been
     * reported for the node:
     *   - if it is on the same line, append the details to the existing error
     *   - if it is on a different line, add it as a new error but mark it as
     *     being 'continued'
     *
     * @param {String} text  The contents of the text node
     */
    ontext: function(text) {
      if (options.templateDelimiters.length === 2) {
        if (text.trim().indexOf(options.templateDelimiters[0]) === 0 &&
          new RegExp(options.templateDelimiters[1] + '$').test(text.trim())) {
            return;
          }
      }
      var scope = lines[state.lineNumber - 1];
      var evidence;

      if (
        isHardcodedString(text) &&
        options.ignoreTags.indexOf(state.tagStack.last().name) === -1
      ) {
        if (state.tagStack.last().error) {
          if (state.lineNumber !== state.tagStack.last().error.error.line) {
            evidence = new RegExp('(' +
                text.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + ')');

            errors.push(extend(true, {}, state.tagStack.last().error, {
              error: {
                code: 'W001',
                reason: 'Hardcoded <' + state.tagStack.last().name + '> tag (continued)',
                line: state.lineNumber,
                evidence: evidence,
                scope: originalLines[state.lineNumber - 1],
                character: scope.indexOf(scope.match(evidence)[1])
              }
            }));

            lines[state.lineNumber - 1] = scope.replace(evidence, '');
          } else {

            // Update existing error
            evidence = state.tagStack.last().error.error.evidence;

            state.tagStack.last().error.error.evidence = new RegExp(
                evidence.toString().slice(1, -1) + '.*?' + '(' + text.replace(
                    /[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + ')'
            );
          }
        } else {
          evidence = new RegExp('[>\\n\\r]*(' +
              text.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + ')');

          var find = scope.slice(scope.indexOf(scope.match(evidence)[0]));

          errors.push(extend(true, {}, errorTemplate, {
            error: {
              code: 'W001',
              reason: 'Hardcoded <' + state.tagStack.last().name + '> tag',
              line: state.lineNumber,
              evidence: evidence,
              scope: originalLines[state.lineNumber - 1],
              character: (scope.length - find.length) + find.indexOf(find.match(evidence)[1])
            }
          }));

          state.tagStack.last().error = errors[errors.length - 1];
        }
      }
    },
    /**
     * When a tag is closed, pop the tag stack.
     */
    onclosetag: function(name) {
      /* @todo tidy up
       * Account for template delimiters which begin with '<' (such as EJS) -
       * htmlparser2 picks them up as tags
       */
      if (options.templateDelimiters.length === 2) {
        if (name.indexOf(options.templateDelimiters[1].slice(1)) !== -1) {
          return;
        }
      }
      state.tagStack.pop();
    },
    /**
     * When a new attribute is encountered, check if it is in the list of
     * attribute names that should be scanned for hardcoded strings.  If it is,
     * check if `value` is a hardcoded string and report appropriately.
     *
     * @param {String} name   The name of the attribute, e.g. 'alt'
     * @param {String} value  The attribute's value
     */
    onattribute: function(name, value) {
      var scope = lines[state.lineNumber - 1];
      var evidence;

      if (options.attributes.indexOf(name) !== -1) {
        if (isHardcodedString(value)) {
          evidence = new RegExp('(' +
              value.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + ')');

          errors.push(extend(true, {}, errorTemplate, {
            error: {
              code: 'W002',
              reason: 'Hardcoded \'' + name + '\' attribute',
              line: state.lineNumber,
              evidence: evidence,
              scope: originalLines[state.lineNumber - 1],
              character: scope.indexOf(scope.match(evidence)[1])
            }
          }));

          lines[state.lineNumber - 1] = scope.replace(evidence, function(text) {
            return [].map.call(text, function() { return ' '; }).join('');
          });
        }
      }
    }
  });

  /* Feed each line of the source file into the parser, one-by-one.  Increment
   * the `lineNumber` state counter each time we feed in a new line.
   */
  lines.forEach(function(line) {
    state.lineNumber++;
    parser.write(line);
  });

  parser.end();

  return errors;
};

// Build default reporters object
hslint.reporters = {};
fs.readdirSync(__dirname + '/reporters').forEach(function(file) {
  hslint.reporters[file.replace(/\.[a-z]+$/, '')] = require(
    __dirname + '/reporters/' + file
  ).reporter;
});

module.exports = hslint;
