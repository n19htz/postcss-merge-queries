# PostCSS Media Query Packer

Simple media packer, merges same CSS media query rules into one via PostCSS

[![npm](https://img.shields.io/npm/v/postcss-merge-queries)](https://www.npmjs.com/package/postcss-merge-queries)
[![GitHub](https://img.shields.io/github/license/n19htz/postcss-merge-queries)](https://github.com/n19htz/postcss-merge-queries/blob/master/LICENSE)
[![Build Status](https://travis-ci.org/n19htz/postcss-merge-queries.svg?branch=master)](https://travis-ci.org/n19htz/postcss-merge-queries)

## ABOUT

A straight forward example of what it does for you:

### Before

```css
.btn {
  display: inline-block;
}

@media screen and (max-width: 660px) {
  .btn {
    display: block;
    width: 100%;
  }
}

.wrapper {
  max-width: 1160px;
}

@media screen and (max-width: 660px) {
  .wrapper {
    max-width: 400px;
  }
}
```

### After

```css
.btn {
  display: inline-block;
}

.wrapper {
  max-width: 1160px;
}

@media screen and (max-width: 660px) {
  .btn {
    display: block;
    width: 100%;
  }
  .wrapper {
    max-width: 400px;
  }
}
```

## INSTALL

```bash
npm install --save-dev postcss-merge-queries
```

## USAGE

Usage as a PostCSS plugin:

### Gulp

`gulpfile.js`

```javascript
const gulp = require('gulp');
const scss = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps');
const postcss = require('gulp-postcss');
const postcssMergeRules = require('postcss-merge-rules');
const cssnano = require('cssnano');
const postcssMergeQueries = require('postcss-merge-queries');

const processStyles = () => {
  const plugins = [
    postcssMergeQueries(),
    postcssMergeRules(),
    cssnano({...}),
  ];

  return gulp.src('./path/to/src')
      .pipe(sourcemaps.init())
      .pipe(scss()).on('error', scss.logError)
      .pipe(postcss(plugins))
      .pipe(sourcemaps.write('.'))
      .pipe(gulp.dest('./path/to/dist'));
};
```

### Webpack

`webpack.config.js`

```javascript
const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const webpack = require('webpack')
// ...
module: {
    rules: [
      {
        test: /\.s?css$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              hmr: true,
              reloadAll: true,
            },
          },
          {
            loader: 'css-loader',
            options: {
              importLoaders: 2,
            },
          },
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [
                  'postcss-import',
                  'postcss-merge-queries',
                  ...
                ],
              },
            },
          },
          {
            loader: 'sass-loader',
          },
        ],
      },
    ],
  },
//...
```

`postcss.config.js`

```javascript
module.exports = {
  plugins: [
    'postcss-merge-queries',
    'postcss-merge-rules',
    [
      'cssnano',
      {
        preset: [
          'advanced',
          {
            normalizeWhitespace: false,
            discardUnused: false,
            mergeIdents: false,
            reduceIdents: false,
            autoprefixer: {},
          },
        ],
      },
    ],
  ],
};
```

## LICENSE

[MIT](https://github.com/n19htz/postcss-merge-queries/blob/master/LICENSE)
