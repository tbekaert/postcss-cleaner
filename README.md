# PostCSS Css Cleaner [![Build Status][ci-img]][ci]

[PostCSS] plugin to clean unused CSS.

[PostCSS]: https://github.com/postcss/postcss
[ci-img]:  https://travis-ci.org/tbekaert/postcss-css-cleaner.svg
[ci]:      https://travis-ci.org/tbekaert/postcss-css-cleaner

```css
.foo {
    /* Input example */
}
```

```css
.foo {
  /* Output example */
}
```

## Usage

```js
postcss([ require('postcss-css-cleaner') ])
```

See [PostCSS] docs for examples for your environment.
