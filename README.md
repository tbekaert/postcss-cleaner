# PostCSS Cleaner

[PostCSS] plugin to clean unused CSS.

---

[![Build Status][ci-img]][ci] [![Dependencies][dep-img]][dep]
[![Dependencies][depdev-img]][depdev]
[![Coverage Status][coveralls-img]][coveralls]

[postcss]: https://github.com/postcss/postcss
[ci-img]: https://travis-ci.org/tbekaert/postcss-cleaner.svg
[ci]: https://travis-ci.org/tbekaert/postcss-cleaner
[dep-img]: https://david-dm.org/tbekaert/postcss-cleaner/status.svg
[dep]: https://david-dm.org/tbekaert/postcss-cleaner
[depdev-img]: https://david-dm.org/tbekaert/postcss-cleaner/dev-status.svg
[depdev]: https://david-dm.org/tbekaert/postcss-cleaner?type=dev
[coveralls-img]: https://coveralls.io/repos/github/tbekaert/postcss-cleaner/badge.svg?branch=master
[coveralls]: https://coveralls.io/github/tbekaert/postcss-cleaner?branch=master

## Description

This plugin search for selector presence in your source files, regardless of
sources files extension. If it can find a selector, it removes it.

It doesn't create any virtual DOM. Instead, it just read your source files code
to check the presence of each selector in each rule.

## Usage

```js
let postcss_cleaner = require('postccs-cleaner');

let options = {
    sources: ['array', 'of', 'source', 'files'], // Required, files to compare CSS against
    raw: 'h1.classname test', // Optionnal ,if 'sources' is already included, it will be overwrite
    ignore: ['.ignored-class', /or-ignored-regex/],
    log: {
        sourcesList: false,
        removedRules: false,
        ignoredRules: false
    }
};

postcss([postcss_cleaner(options)]).process(css); // `css` is your stylesheet
```

Alternatively, you can ignore portions of your CSS using comments.

```CSS
.foo{ }

/* postcss-cleaner: ignore on*/
.bar{ }
/* postcss-cleaner: ignore off*/

.baz{ }
```

See [PostCSS] docs for examples for your environment.

## Example

### CSS Input

```css
/* Css Input */
.foo {
}

.bar {
}

th td,
tr td {
}

.baz {
}

.js-action {
}
```

### Source files

```html
<!-- HTML Input -->
<div class="foo">
    Lorem ipsum dolor sit amet.
</div>
```

```slim
# Slim Input
table
    tr
        td
            | Lorem ipsum dolor sit amet.
```

```js
// JS Input
document.querySelector('.js-action').addEventListener('click', e => {
    /* [...] */
});
```

### CSS Output

```css
.foo {
}

tr td {
}

.js-action {
}
```

## To do

* [x] Improve test suite
* [ ] Improve doc
* [ ] Clean plugin's code
