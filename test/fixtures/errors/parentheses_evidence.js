module.exports = function() {
  'use strict';
  var extend = require('node.extend');

  return extend(true, [], [
    {
      file: 'test/fixtures/parentheses.html',
      error: {
        id: '(error)',
        code: 'W001',
        reason: 'Hardcoded <p> tag',
        evidence: /(Add favourite \()/.toString(),
        line: 2,
        character: 5,
        scope: '  <p>Add favourite (<span class=\'off\'></span>) by page?</p>'
      }
    },
    {
      file: 'test/fixtures/parentheses.html',
      error: {
        id: '(error)',
        code: 'W001',
        reason: 'Hardcoded <p> tag',
        evidence: /(Add favourite \()/.toString(),
        line: 3,
        character: 5,
        scope: '  <p>Add favourite (<i>content</i>) something</p>'
      }
    },
    {
      file: 'test/fixtures/parentheses.html',
      error: {
        id: '(error)',
        code: 'W001',
        reason: 'Hardcoded <i> tag',
        evidence: /(content)/.toString(),
        line: 3,
        character: 23,
        scope: '  <p>Add favourite (<i>content</i>) something</p>'
      }
    }
  ]);
};

