/**
 * @todo investigate if it would be easier to report errors for a tag after the
 *       tag has been closed:
 *         - inside `ontext`, add to existing text for current node (delimited
 *           by .*?)
 *         - report errors in `onclosetag`
 *
 * @hack template delimited content replaced by spaces so that it doesn't
 *       interfere but it's "presence" is maintained...
 * @hack some nasty regular expressions going on
 * @todo a lot of logic going on in the `ontext` parser callback
 * @todo horrible, horrible checks for if templateDelimiters.length is 2...
 * @todo the HSLINT object doesn't feel right.  We need to track the info, but
 *       a plain object just seems wrong for some reason.
 * @todo support streaming!
 *
 * hslint
 *
 * Scans a HTML-like file to find text nodes and attributes whose values look
 * like hardcoded strings, i.e. untranslated text which is not using an i18n
 * system.
 *
 * It feeds the source file line-by-line into a HTML parser, so that the line
 * number and tag can be kept track of for accurate error reporting.
 *
 * Copyright (c) 2015 James Warwood
 * Licensed under the MIT license.
 */
'use strict';

// Core dependencies
var fs = require('fs');

// npm dependencies
var _ = require('lodash');
var extend = require('node.extend');
var htmlparser = require('htmlparser2');

// Project imports
var utils = require('./utils.js');

var HSLINT = {};
var originalLines = [];

/**
 * Takes some evidence and turns it into a RegExp where match groups capture
 * the offending evidence.
 *
 * @param {String} evidence  The evidence for an error
 * @param {String} prepend   (Optional) Content to prepend to regex, which is
 *                           excluded from match groups
 * @param {String} flags     (Optional) flags to set
 *
 * @return {RegExp} a RegExp for searching for the evidence
 */
var createEvidenceRegExp = function(evidence, prepend, flags) {
  prepend = prepend || '';

  // Wrap in a match group and Escape the raw input
  evidence = prepend + '(' + utils.escapeRegExp(evidence) + ')';

  /* @hack
   * Replace repeating groups of spaces with '.*?' and close/open the match
   * groups either side.  The assumption is that repeated spaces are what we
   * used to replace all content inside template delimiters (just after we read
   * the file contents)
   */
  evidence = evidence.replace(/[ ]{4,}/g, ').*?(');

  return new RegExp(evidence, flags);
};

/**
 * Report an error.
 *
 * @param {String}      code  The error code, e.g. 'W001' or 'W002'
 * @param {String}    reason  Description of problem, e.g. 'Hardcoded <a> tag'
 * @param {RegExp}  evidence  A regular expression, which should capture
 *                            offending text in match groups
 * @param {Number} character  The column number that the error appears at
 */
var error = function(code, reason, evidence, character) {
  HSLINT.errors.push({

    // Placeholder id
    id: '(error)',

    // Code, e.g. W001 or W002
    code: code,

    // Description of the problem
    reason: reason,

    // Regex identifying the error within `scope` (below)
    evidence: evidence,

    // Line number of the error within `file`
    line: HSLINT.lineNumber,

    // Column number within `line`
    character: character,

    // Contents of `line` from source file
    scope: originalLines[HSLINT.lineNumber - 1]

  });

  return _.last(HSLINT.errors);
};

/**
 * hslint
 *
 * Scan a file for untranslatable strings.
 *
 * @param {String} file     File name
 * @param {Object} options  Options for linting
 *
 * @return {[Object]} an array of error objects
 */
var hslint = function(file, options) {

  // Read the original file as an array of lines
  return hslint.scan(fs.readFileSync(file).toString(), options, file);
};

/**
 * hslint.scan
 *
 * Scan a portion of text for untranslatable strings.
 *
 * Errors are reported in the following format:
 *
 *    {
 *      id: String, // usually '(error)'
 *      code: String, // warning code (see Warning Numbers)
 *      reason: String, // message describing the error
 *      evidence: RegExp, // with the offending text in match groups
 *      line: Number, // line number of the error
 *      character: Number, // column where evidence begins
 *      scope: String // where the error was found
 *    }
 *
 * @param {String}   lines  The text to scan
 * @param {Object} options  The scanning options
 *
 * @return {[Object]} an array of error objects.  The error object format is
 *                    described above.
 */
hslint.scan = function(lines, options) {

  // Extend options with defaults
  options = extend({
    attributes: ['title', 'alt'],
    ignoreTags: ['script', 'style', 'pre'],
    templateDelimiters: []
  }, options);

  HSLINT = {
    errors: [],
    lineNumber: 0,
    tagStack: []
  };

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
  originalLines = lines.split('\n');

  /* @hack @todo replaces all template delimited-content with spaces (see file
   * header)
   */
  if (options.templateDelimiters.length === 2) {
    lines = lines.replace(new RegExp(
      options.templateDelimiters.join('(?:.|\\n|\\r)*?'), 'g'
    ), function(match) {
        return match.replace(/./g, ' ');
    }).split('\n');

  } else {
    lines = lines.split('\n');
  }

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

      // Add to the stack
      HSLINT.tagStack.push({
        name: name,
        error: null // Will be used to indicate if an error is a continuation
      });
    },
    /**
     * When a new text node is encountered, check if it's text is a hardcoded
     * string.  If it is, add it as an errf an error has already been
     * reported for the node:
     *   - if it is on the same line, append the details to the existing error
     *   - if it is on a different line, add it as a new error but mark it as
     *     being 'continued'
     *
     * @param {String} text  The contents of the text node
     */
    ontext: function(text) {
      text = text.trim();

      var lastTag = _.last(HSLINT.tagStack) || {};
      var scope = lines[HSLINT.lineNumber - 1];
      var evidence, find, match;

      if (
        utils.isHardcodedString(text) &&
        options.ignoreTags.indexOf(lastTag.name) === -1
      ) {
        if (lastTag.error) {

          /* Account for line breaks between tag's text nodes - add errors on
           * different lines as new errors and mark as continued
           */
          if (HSLINT.lineNumber !== lastTag.error.line) {
            evidence = createEvidenceRegExp(text);

            // Report error
            error(
              'W001',
              lastTag.error.reason + ' (continued)',
              evidence,
              scope.indexOf(scope.match(evidence)[1])
            );

            lines[HSLINT.lineNumber - 1] = scope.replace(evidence, '');
          } else {

            // Update existing error
            _.extend(lastTag.error, {
              evidence: '.*?(' + utils.escapeRegExp(text) + ')'
            }, _.partialRight(utils.appendRegExp, _, _));
          }
        } else {
          evidence = createEvidenceRegExp(text, '[>\\n\\r]*', 'g');

          find = scope.slice(scope.indexOf(scope.match(evidence)[0]));
          var character = -1;
          var longest = -1;

          while ((match = evidence.exec(find)) !== null) {
            if (match[0].length > longest) {
              longest = match[0].length;
              character = evidence.lastIndex - match.slice(1).join('').length;
            }
          }

          lastTag.error = error(
            'W001',
            'Hardcoded ' + (lastTag.name ? '<' + lastTag.name + '> tag' : 'text node'),
            createEvidenceRegExp(text),
            (scope.length - find.length) + character
          );
        }
      }
    },
    /**
     * When a tag is closed, pop the tag stack.
     */
    onclosetag: function(name) {
      HSLINT.tagStack.pop();
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
      var scope = lines[HSLINT.lineNumber - 1];
      var evidence;

      if (
        options.attributes.indexOf(name) !== -1 &&
        utils.isHardcodedString(value)
      ) {
        evidence = createEvidenceRegExp(value);

        error(
          'W002',
          'Hardcoded \'' + name + '\' attribute',
          evidence,
          scope.indexOf(scope.match(evidence)[1])
        );

        /* Replace matched content with spaces so that it doesn't interfere with
         * further processing
         */
        lines[HSLINT.lineNumber - 1] = scope.replace(evidence, function(text) {
          return [].map.call(text, function() { return ' '; }).join('');
        });
      }
    }
  });

  /* Feed each line of the source file into the parser, one-by-one.  Increment
   * the `lineNumber` HSLINT counter each time we feed in a new line.
   */
  lines.forEach(function(line) {
    HSLINT.lineNumber++;
    parser.write(line);
  });

  parser.end();

  return HSLINT.errors;
};

// Build default reporters object
hslint.reporters = {};
fs.readdirSync(__dirname + '/reporters').forEach(function(file) {
  hslint.reporters[file.replace(/\.[a-z]+$/, '')] = require(
    __dirname + '/reporters/' + file
  ).reporter;
});

module.exports = hslint;
