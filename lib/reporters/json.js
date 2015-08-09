/**
 * i18n-lint json reporter
 *
 * Copyright (c) 2014 James Warwood
 * Licensed under the MIT license.
 */
'use strict';

module.exports = function(errors) {
  if (!errors.length) {
    return;
  }

  // Perform stringify on regexes
  errors.forEach(function(error) {
    error.error.evidence = error.error.evidence.toString();
  });

  process.stdout.write(JSON.stringify(errors, null, 2) + '\n');
};
