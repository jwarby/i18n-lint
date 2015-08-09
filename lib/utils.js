/**
 * i18n-lint utils
 *
 * Utility functions for i18n-lint
 *
 * Copyright (c) 2015 James Warwood
 * Licensed under the MIT license.
 */
'use strict';

module.exports = {
  /**
   * Determine whether or not `str` is a hardcoded string
   *
   * @param {String} str  The string to test
   *
   * @return {Boolean} true if the string is classed as a hardcoded string,
   *                   false otherwiser
   */
  isHardcodedString: function(str) {
    str = str ? str.trim() : null;

    if (!str) {
      return false;
    }

    // Single, all lowercase words with no single dots
    if (/^([a-z!\?]|[ ]){2,}?(?:[.]{2,})?$/.test(str)) {
      return true;
    }

    /* Probably a hardcoded string if it contains a captial letter, or lowercase
     * letters and spaces
     */
    return /([A-Z])/.test(str) || /[a-z](?=[ ])/.test(str);
  },
  /**
   * Escape characters in `str` which have a special meaning within a regular
   * expression.
   *
   * @param {String} str  The string to escape
   *
   * @return {String} The escaped string
   */
  escapeRegExp: function(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  },
  /**
   * Append a string of content to an existing RegExp object
   *
   * @param {RegExp} target  The regular expression to append to
   * @param {String} after   The string or regular expression to append
   *
   * @return {RegExp} a new RegExp object
   */
  appendRegExp: function(target, after) {

    // Convert original to string and slice off leading/trailing slashes
    var toString = target.toString().slice(1, -1);

    return new RegExp(toString + after);
  }
};
