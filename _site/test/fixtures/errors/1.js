module.exports = function() {
  'use strict';
  var extend = require('node.extend');

  return extend(true, [], [
    {
      file: 'somefile.html',
      error: {
        id: '(error)',
        code: 'W001',
        reason: 'Hardcoded <p> tag',
        evidence: /(Something)/.toString(),
        scope: '  <p>Something</p>',
        line: 5,
        character: 5
      }
    },
    {
      file: 'somefile.html',
      error: {
        id: '(error)',
        code: 'W002',
        reason: 'Hardcoded \'alt\' attribute',
        evidence: /(Oops)/.toString(),
        scope: '  <a href="#" alt="Oops">{{ not.hardcoded }}</a>',
        line: 7,
        character: 19
      }
    }
  ]);
};
