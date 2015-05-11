module.exports = [
  {
    file: 'afile.html',
    error: {
      id: '(error)',
      code: 'W001',
      reason: 'Hardcoded <p> tag',
      evidence: /(Something)/,
      scope: '  <p>Something</p>',
      line: 5,
      character: 5
    }
  }
];
