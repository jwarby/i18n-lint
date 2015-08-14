module.exports = (function() {
  'use strict';

  return JSON.parse(JSON.stringify([
    {
      file: 'test/fixtures/attribute_new_lines.html',
      error: {
        id: '(error)',
        code: 'W002',
        reason: 'Hardcoded \'alt\' attribute',
        evidence: /(April Fool's)/.toString(),
        line: 2,
        scope: '  <a href="#"\n    alt="April Fool\'s"\n  >Click me</a>',
        character: 23
      }
    },
    {
      file: 'test/fixtures/attribute_new_lines.html',
      error: {
        id: '(error)',
        code: 'W001',
        reason: 'Hardcoded <a> tag',
        evidence: /[> \\n\\r](Click me).*?/.toString(),
        line: 2,
        scope: '  <a href="#"\n    alt="April Fool\'s"\n  >Click me</a>',
        character: 40
      }
    }
  ]));
})();
