module.exports = (function() {
  'use strict';

  return JSON.parse(JSON.stringify([
    {
      file: 'test/fixtures/tabs.html',
      error: {
        'i':'(error)',
        code: 'W001',
        reason: 'Hardcoded <h1> tag',
        evidence: /[> \n\r](I'm tabbed out).*?/.toString(),
        line: 1,
        scope: '\t\t\t\t<h1>I\'m tabbed out</h1>',
        character: 8
      }
    }
  ]));
})();

