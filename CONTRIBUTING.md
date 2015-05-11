# Contributing to HSLint

Thanks for your interest in contributing to HSLint!  Please read this short guide
before getting started.

## Bugs

- Bugs should be reported on the [GitHub issue tracker](https://github.com/jwarby/hslint/issues)

## Pull Requests

- Please be sure to follow the existing code style
- Make sure the test suite still passes (see _Testing_ below)
- Submit pull requests against the `dev` branch, **not** `master`

## Testing

- Run tests with `npm test`
  - This will lint the JS files in `bin/`, `lib/` and `test/` first (using [`jshint`](http://jshint.com))
  - If the linting passes, the [`mocha`](http://mochajs.org) test suite will then be executed

Happy hacking!
