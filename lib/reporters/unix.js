/**
 * i18n-lint unix reporter
 *
 * Copyright (c) 2015 James Warwood
 * Licensed under the MIT license.
 */
'use strict';

// Core imports
var util = require('util');

module.exports = function(errors) {
  errors.forEach(function(error) {
    var err = error.error;

    process.stdout.write(util.format(
      '%s:%d:%d %s', error.file, err.line, err.character, err.reason
    ));
    process.stdout.write('\n');
  });
};
