/**
 * i18n-lint simple reporter
 *
 * Copyright (c) 2014 James Warwood
 * Licensed under the MIT license.
 */
'use strict';

module.exports = {
  reporter: function(errors) {
    if (!errors.length) {
      return;
    }

    /**
     * Print an error, with the appropriate formatting.
     *
     * @param {Object} error  The error details object
     */
    function showError(error) {
      var details = error.error;
      process.stdout.write(error.file + ': line ' + details.line +
          ', column ' + details.character + ', ' + details.reason + '\n');
    }

    errors.forEach(showError);
  }
};
