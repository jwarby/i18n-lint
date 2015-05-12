'use strict';

module.exports = {
  file: 'test/fixtures/testing.html',
  error: {
    id: '(error)',
    code: 'W001',
    reason: 'Hardcoded <a> tag',
    evidence: /[>\n\r]*(Fork me on GitHub!)/,
    line: 13,
    scope: '      <a data-ga-category="github links" data-ga-label="fork" ' +
      'href="https://github.com/jwarby/jquery-awesome-cursor/fork" class="btn' +
      ' btn-lg btn-success"><i class="fa fa-code-fork"></i> Fork me on '+
      'GitHub!</a>',
    character: 185
  }
};
