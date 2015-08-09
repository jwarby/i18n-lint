# Contributing to i18n-lint

## Bugs

- Bugs should be reported on the [GitHub issue tracker](https://github.com/jwarby/i18n-lint/issues)

## Pull Requests

- Please be sure to follow the existing code style
- Make sure the test suite still passes (see _Testing_ below)
- Submit pull requests against the `dev` branch, **not** `master`

## Testing

- Run tests with `npm test`
  - This will lint the JS files in `bin/`, `lib/` and `test/` first (using [`jshint`](http://jshint.com))
  - If the linting passes, the [`mocha`](http://mochajs.org) test suite will then be executed
- To run the tests *and* check code coverage, run:
  - `npm run-script coverage`

Happy hacking!
