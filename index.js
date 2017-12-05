'use strict';

let postcss = require('postcss');
let glob = require('glob');
let fs = require('fs');

module.exports = postcss.plugin('postcss-cleaner', opts => {
    opts = opts || {};

    let log = function(type, args) {
        if (opts.log) {
            if (
                (type === 'sourcesList' && opts.log.sourcesList) ||
                (type === 'removedRules' && opts.log.removedRules) ||
                (type === 'ignoredRules' && opts.log.ignoredRules)
            ) {
                console.log(...args);
            }
        }
    };

    let flatten = arr =>
        arr.reduce(
            (a, b) => (Array.isArray(b) ? a.concat(flatten(b)) : a.concat(b)),
            []
        );

    let getFilesContent = function() {
        let patterns = flatten(arguments[0]);

        log('sourcesList', ['=== Source files ===']);

        return flatten(
            patterns.map(pattern => {
                return glob.sync(pattern).map(file => {
                    log('sourcesList', [file]);
                    let content = fs.readFileSync(file);
                    return content;
                });
            })
        ).join('\n');
    };

    if (Array.isArray(opts.sources)) {
        opts.raw = getFilesContent(opts.sources);
    }
    opts.ignore = [/[\d]*%/].concat(opts.ignore ? opts.ignore : []);

    return function(root, result) {
        let isActive = true;
        if (!opts.raw) {
            result.warn(
                'Array of sources or raw source is ' +
                    'necessary to run this plugin. See doc.'
            );
            return;
        }
        root.walk(rule => {
            if (rule.type === 'comment') {
                if (rule.text.indexOf('postcss-cleaner:ignore') > -1) {
                    isActive = !(rule.text.indexOf('on') > -1);
                }
            } else if (rule.type === 'rule') {
                if (!isActive) {
                    log('ignoredRules', [
                        `Ignore selector '${rule.selectors}' line ${
                            rule.source.start.line
                        }`
                    ]);
                } else {
                    let selectors = rule.selector
                        .replace(/[\n]/, '')
                        .split(',');
                    let testSelectors = selectors.map(s => {
                        return s
                            .replace(/\.|#|\=|(\[[^=]*=)|\]/g, ' ')
                            .replace(/\[/g, ' ')
                            .replace(
                                />|~|\+|\'|"|\n|\t|\*|:not\([^\)]*\)|(::?[^\s:]*)/g,
                                ''
                            )
                            .split(' ')
                            .filter(sel => sel !== '');
                    });

                    testSelectors.map((sel, i) => {
                        let isIgnored = sel
                            .map(s => {
                                return opts.ignore
                                    .map(r => {
                                        return typeof r === 'string'
                                            ? r.replace(/\.|#/g, '') === s
                                            : r.test(s);
                                    })
                                    .reduce((r, b) => (r ? r : b), false);
                            })
                            .reduce((s, b) => (s ? s : b), false);

                        if (!isIgnored) {
                            let isFound = sel
                                .map(s => opts.raw.indexOf(s) >= 0)
                                .reduce((s, b) => (!s ? s : b), true);

                            if (!isFound) {
                                if (selectors[i]) {
                                    log('removedRules', [
                                        `Remove selector '${
                                            selectors[i]
                                        }' line ${rule.source.start.line}`
                                    ]);
                                }
                                selectors.splice(i, 1);
                            }
                        } else {
                            log('ignoredRules', [
                                `Ignore selector '${selectors[i]}' line ${
                                    rule.source.start.line
                                }`
                            ]);
                        }
                    });

                    rule.selector = selectors.map(s => s.trim()).join(', ');

                    if (rule.selector === '') rule.remove();
                }
            }
        });
    };
});
