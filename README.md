# hslint [![GitHub version](https://badge.fury.io/gh/jwarby%2Fhslint.svg)](http://semver.org/spec/v2.0.0.html)

[![Build Status](https://secure.travis-ci.org/jwarby/hslint.png?branch=master)](https://travis-ci.org/jwarby/hslint)
[![Dependency Status](https://david-dm.org/jwarby/hslint.svg?style=flat)](https://david-dm.org/jwarby/hslint)
[![devDependency Status](https://david-dm.org/jwarby/hslint/dev-status.svg?style=flat)](https://david-dm.org/jwarby/hslint#info=devDependencies)
[![Code Climate](https://codeclimate.com/repos/5552ffb3e30ba05e900189ff/badges/cfdc4caea41288f2c610/gpa.svg)](https://codeclimate.com/repos/5552ffb3e30ba05e900189ff/feed)
[![Test Coverage](https://codeclimate.com/repos/5552ffb3e30ba05e900189ff/badges/cfdc4caea41288f2c610/coverage.svg)](https://codeclimate.com/repos/5552ffb3e30ba05e900189ff/coverage)

`hslint` is a tool for detecting hardcoded (untranslated) strings in HTML and template source files.  It can be used a CLI utility, or as library.
`hslint` detects instances where a HTML element's text node or certain attributes look like a hardcoded string.

See <https://jwarby.github.io/hslint/> for the full documentation and demos.

![hslint screenshot](screenshot.png)

## Getting started

### Installing

Install using npm:

```shell
  $ npm install -g hslint
```

Installing globally will give you access to the `hslint` binary from anywhere.

## Documentation

See <https://jwarby.github.io/hslint/> for the full documentation.

### CLI

The CLI program is called `hslint`, and will be available once `hslint` has been installed globally.

Usage:

```shell
  $ hslint [OPTIONS] <file ...>
```

#### Program help and information

- Run `hslint --help` or `hslint -h` to display help output and then exit
- Run `hslint --version` or `hslint -V` to display version and then exit
- Run `man hslint` on systems which support `man` to view the Linux manual page

#### Linting files

To lint a file, call `hslint <file>`:

```shell
  $ hslint some_file.html
```

You can use a glob pattern too:

```shell
  $ hslint app/views/**/*.html
```

#### Options

##### `-h, --help`

Display help and then exit

##### `-V, --version`

Display version information and then exit

##### `-t, --template-delimiters <delimiters>`

Set the template delimiters which the source files use.  The value should be the start and
end delimiters, separated by a comma.  For example, if running
`hslint` against template files which use a Mustache-like syntax, use the following:

```shell
  $ hslint -t "{{,}}" views/**/*.hbs
```

Similarly, but for EJS-syntax:

```shell
  $ hslint -t "<%,%>" views/**/*.ejs
```

##### `-a, --attributes <attributes>`
###### default: `title,alt`

A comma-separated list of which HTML attributes should be checked.

##### `-i, --ignore-tags <tags>`
###### default: `style,script`

A comma-separated list of HTML tags to ignore when searching for hardcoded strings.

##### `-r, --reporter <reporter>`
###### default: `default`

The reporter to use when outputting information.  The reporters follow the same structure as
JSHint reporters, and the `hslint` library reports error in the same manner as JSHint - this
means you can use any existing JSHint reporters as reporters for `hslint`!

There are two built-in reporters that get shipped with HSLint: `default` and `simple`

To write your own reporters, look to `lib/reporters/default.js` as a starting point.

##### `--exclude <patterns>`

A comma-separated list of file patterns to exclude, such as `'docs/,ignored.html'`.

Maintain/turn off colored output.  For more info, see <https://www.npmjs.com/package/chalk#chalk-supportscolor>.

##### `--color/--no-color`

Maintain/turn off colored output.  For more info, see <https://www.npmjs.com/package/chalk#chalk-supportscolor>.

#### Exit Status

- `0`: if everything went OK, and no hardcoded strings were found
- `1`: if hardcoded strings were found
- `64`: command-line usage error, e.g. no input files provided (`[EX_USAGE]`)
- `66`: cannot open input, e.g. input files I/O error, specified reporter file does not exist (`[EX_NOINPUT]`)
- `70`: internal software error (`[EX_SOFTWARE]`)

#### Colored Output

To maintain colored output, run `hslint` with the `--color` flag:

```shell
  $ hslint --color **/*.html | less -R
```

### Library

To use `hslint` as a library, install it locally and `require` it in your projects:

```shell
  $ npm install --save-dev hslint
```

```javascript
var hslint = require('hslint');

var errors = hslint('some_file.ejs', {
  templateDelimiters: ['<%','%>'],
  attributes: ['title', 'alt', 'data-custom-attr']
});
```

#### Options

Options are passed as an object, as the second parameter to `hslint`.

##### `templateDelimiters`
###### type: `Array`, default: `[]`

Specify the start and end template delimiters which the source files use.  For example,
when linting EJS files:

```javascript
  hslint('file.ejs', {
    templateDelimiters: ['<%', '%>']
  });
```

##### `attributes`
###### type: `Array`, default: `['title', 'alt']`

Specify which HTML attributes to check when searching for hardcoded strings.

##### `ignoreTags`
###### type: `Array`, default: `['style', 'script']`

An array of tags which should be ignored when searching for hardcoded strings.

#### Using Reporters

When using `hslint` as a library, you can still use the reporters.  Built-in reporters are
available as `reporters` on the `hslint` function:

```javascript
console.log(hslint.reporters);
// {
//  default: [Function]
// }

var reporter = hslint.reporters.default;
var errors = hslint('file.html', {});

reporter(errors);
```

There are currently two built-in reporters: `default` and `simple`.

To use other reporters, simply require them:

```javascript
var hslint = require('hslint');
var reporter = require('hslint-awesome-reporter');

reporter(hslint('file.html', {}));
```

#### Error Format

```javascript
{
  file: '', // string, file which contains the errors,
  error: {
    id: String, // usually '(error)'
    code: String, // warning code (see Warning Numbers)
    reason: String, // message describing the error
    evidence: RegExp, // with the offending text in match groups
    line: Number, // line number of the error
    character: Number, // column where evidence begins
    scope: String // where the error was found
  }
}
```

### Grunt

There is a grunt task which wraps `hslint`'s functionality, which
can be found at <https://github.com/jwarby/grunt-hslint>.

## Warning Numbers

- `W001`: hardcoded text node found
- `W002`: hardcoded attribute value found

## Contributing

See [CONTRIBUTING.md](https://github.com/jwarby/hslint/blob/master/CONTRIBUTING.md).

### Running Tests

- `npm test`
  - lints JS files in `bin/`, `lib/` and `test/`
  - runs [`mocha`](http://mochajs.org) test suite

## Release History

HSLint follows [SemVer](http://semver.org/spec/v2.0.0.html) rules for version numbers.

~~No releases yet~~

## License

Copyright (c) 2015 James Warwood.  Licensed under the MIT license.

## Authors

See [AUTHORS.txt](https://github.com/jwarby/hslint/blob/master/AUTHORS.txt).
## Acknowledgements

- CLI app scaffolding from <https://github.com/Hypercubed/generator-commander>
