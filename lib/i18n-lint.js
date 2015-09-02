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
 * @todo the I18NLINT object doesn't feel right.  We need to track the info, but
 *       a plain object just seems wrong for some reason.
 * @todo support streaming!
 *
 * i18n-lint
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

var I18NLINT = {};
var originalLines = [];
var lineError = {};

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
var error = function(code, reason, evidence, character, scope, line) {

  I18NLINT.errors.push({

    // Placeholder id
    id: '(error)',

    // Code, e.g. W001 or W002
    code: code,

    // Description of the problem
    reason: reason,

    // Regex identifying the error within `scope` (below)
    evidence: evidence,

    // Line number of the error within `file`
    line: line || I18NLINT.lineNumber,

    // Column number within `line`
    character: character,

    // Contents of `line` from source file
    scope: scope || originalLines[I18NLINT.lineNumber - 1].replace(/\r$/, '')

  });

  return _.last(I18NLINT.errors);
};

/**
 * Checks the `lineError` variable and reports appropriately.
 *
 * Side effects:
 *   - adds new errors, or modifies an existing one
 *   - resets `lineError` to an empty object
 */
var reportErrors = function() {
  var currentTag = _.last(I18NLINT.tagStack) || {};

  if (Object.keys(lineError).length) {
    if (currentTag.error && I18NLINT.lineNumber === currentTag.error.line) {
      currentTag.error.evidence = utils.appendRegExp(
        currentTag.error.evidence,
        '.*?' + lineError.evidence.toString().slice(1, -1)
      );
    } else {
      currentTag.error = error(
        'W001',
      'Hardcoded ' + (currentTag.name ?
          '<' + currentTag.name + '> tag' : 'text node') + (currentTag.error ? ' (continued)' : ''),
        lineError.evidence,
        lineError.character
      );
    }
  }

  lineError = {};
};

/**
 * I18nLint
 *
 * Scan a file for untranslatable strings.
 *
 * @param {String} file     File name
 * @param {Object} options  Options for linting
 *
 * @return {[Object]} an array of error objects
 */
var I18nLint = function(file, options) {

  // Read the original file as an array of lines
  return I18nLint.scan(fs.readFileSync(file).toString(), options, file);
};

/**
 * i18n-lint.scan
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
I18nLint.scan = function(lines, options) {

  // Extend options with defaults
  options = extend({
    attributes: ['alt', 'placeholder', 'title'],
    ignoreTags: ['script', 'style', 'pre', 'code'],
    templateDelimiters: []
  }, options);

  I18NLINT = {
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
   * In the above, 'Save the item' will be replaced so it doesn't intefere when
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
      reportErrors();

      // Add to the stack
      I18NLINT.tagStack.push({
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

      // Remove any leading/trailing parentheses, and trim
      text = text.trim().replace(/^[\(\)]|[\(\)]$/gi, '').trim();

      var currentTag = _.last(I18NLINT.tagStack);
      var scope = lines[I18NLINT.lineNumber - 1];
      var evidence, find, match;

      if (!currentTag) {
        currentTag = {
          name: '',
          error: null
        };

        I18NLINT.tagStack.push(currentTag);
      }

      if (
        options.ignoreTags.indexOf(currentTag.name) === -1 &&
        utils.isHardcodedString(text)
      ) {
        if (!Object.keys(lineError).length) {

          // Work out character (column) number
          evidence = createEvidenceRegExp(text, '[>\\n\\r]* *', 'g');

          find = scope.slice(scope.indexOf(scope.match(evidence)[0]));
          var character = find;
          var longest = -1;

          while ((match = evidence.exec(find)) !== null) {
            if (match[0].length > longest) {
              longest = match[0].length;
              character = evidence.lastIndex -
                (match[0].length - match[0].indexOf(match[1]));
            }
          }

          lineError.evidence = createEvidenceRegExp(text);
          lineError.character = (scope.length - find.length) + character;
        } else {
          lineError.evidence = utils.appendRegExp(lineError.evidence, '.*?(' +
              utils.escapeRegExp(text) + ')');
        }
      }
    },
    /**
     * When a tag is closed, pop the tag stack.
     *
     * @param {String} name  The name of the tag
     */
    onclosetag: function(name) {
      reportErrors();

      I18NLINT.tagStack.pop();
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
      var scope = lines[I18NLINT.lineNumber - 1];
      var evidence;

      if (
        options.attributes.indexOf(name) !== -1 &&
        utils.isHardcodedString(value)
      ) {
        evidence = createEvidenceRegExp(value, null, 'm');

        var context = originalLines.join('\n').match(evidence)[1];
        var offset = context.split('\n').length;
        scope = originalLines.slice(I18NLINT.lineNumber - offset, I18NLINT.lineNumber).join('\n');

        error(
          'W002',
          'Hardcoded \'' + name + '\' attribute',
          evidence,
          scope.indexOf(context),
          scope,
          (I18NLINT.lineNumber - offset) + 1
        );

        /* Replace matched content with spaces so that it doesn't interfere with
         * further processing
         */
        lines[I18NLINT.lineNumber - 1] = scope.replace(evidence, function(text) {
          return [].map.call(text, function() { return ' '; }).join('');
        });
      }
    }
  }, {
    decodeEntities: true,
    lowerCaseTags: true,
    lowerCaseAttributeNames: true
  });

  /* Feed each line of the source file into the parser, one-by-one.  Increment
   * the `lineNumber` I18NLINT counter each time we feed in a new line.
   */
  lines.forEach(function(line) {
    reportErrors();

    I18NLINT.lineNumber++;

    parser.write(line + '\n');
  });

  parser.end();

  /* Ensures any errors on the last line of a file with no newline at EOF still
   * get reported */
  reportErrors();

  return I18NLINT.errors;
};

// Build default reporters object
I18nLint.reporters = {};
fs.readdirSync(__dirname + '/reporters').forEach(function(file) {
  I18nLint.reporters[file.replace(/\.[a-z]+$/, '')] = require(
    __dirname + '/reporters/' + file
  );
});

module.exports = I18nLint;
