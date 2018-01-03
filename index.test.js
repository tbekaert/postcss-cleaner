let postcss = require('postcss');

let plugin = require('./');

function run(input, output, opts) {
    return postcss([plugin(opts)])
        .process(input, { from: undefined })
        .then(result => {
            expect(result.css).toEqual(output);
            expect(result.warnings().length).toBe(0);
        });
}

function runError(input, output, opts) {
    return postcss([plugin(opts)])
        .process(input, { from: undefined })
        .then(result => {
            expect(result.css).toEqual(output);
            expect(result.warnings().length).toBeGreaterThan(0);
        });
}

function runLog(input, output, opts) {
    let logs = [];
    let storeLog = inputs => logs.push(inputs);
    console.log = jest.fn(storeLog);

    return postcss([plugin(opts)])
        .process(input, { from: undefined })
        .then(result => {
            expect(logs.join('\n')).toBe(output.join('\n'));
            expect(result.warnings().length).toBe(0);
        });
}

/**
 * Options
 */

it('return same CSS and a warning if no sources provided', () => {
    return runError('a{ }', 'a{ }');
});

it('return same CSS and a warning if opts.sources is not an array', () => {
    return runError('a{ }', 'a{ }', {
        sources: 'lorem'
    });
});

it('remove rules based on sources array', () => {
    return run('.foo{ } .bar{ } .baz{ }', '.foo{ } .bar{ }', {
        sources: ['source.html']
    });
});

/**
 * Removal
 */

it('remove unused css in html sources', () => {
    return run('.foo{ } .bar{ } .baz{ }', '.foo{ } .baz{ }', {
        raw: `
          <div class="foo">
            <p class="baz">Lorem</p>
          </div>
        `
    });
});

it('remove unused css in slim sources', () => {
    return run('.foo{ } .bar{ } .baz{ }', '.foo{ } .bar{ }', {
        raw: `
            div.foo
              p class="bar"
                | Lorem
        `
    });
});

it('remove unused css in js sources', () => {
    return run('.foo{ } .bar{ } .baz{ }', '.bar{ }', {
        raw: 'document.querySelectorAll(".bar")'
    });
});

it('remove unused selector in rule', () => {
    return run('.foo, .bar, .baz{ }', '.foo, .bar{ }', {
        raw: `
          <div class="foo">
            <p class="bar">Lorem</p>
          </div>
        `
    });
});

it('remove unused multi selector in rule', () => {
    return run('th td, tr td{ }', 'tr td{ }', {
        raw: `
          <table>
            <tr>
              <td>Cell</td>
            </tr>
          </table
        `
    });
});

it('remove unused selector if any child selector is not found', () => {
    return run('.foo .bar, .foo .baz{ }', '.foo .baz{ }', {
        raw: `
          <div class="foo">
            <p class="baz">Lorem</p>
          </div>
        `
    });
});

it('remove unused selector if it is not found', () => {
    return run('.sm-foo, .foo .bar{ } .md-foo{ }', '.md-foo{ }', {
        raw: '<div class="md-foo bar"></div>'
    });
});

/**
 * Ignorance
 */

it('ignore rule based on string', () => {
    return run('.foo{ } .bar{ } .baz{ }', '.bar{ }', {
        raw: `
          <div class="a">
            <p class="b">Lorem</p>
          </div>
        `,
        ignore: ['.bar']
    });
});

it('ignore rule based on regex', () => {
    return run('.foo{ } .bar{ } .baz{ }', '.bar{ } .baz{ }', {
        raw: `
          <div class="a">
            <p class="b">Lorem</p>
          </div>
        `,
        ignore: [/ba/]
    });
});

it('ignore rule based on comment', () => {
    return run(
        `
            .foo{ }

            /* postcss-cleaner:ignore on */
            .bar{ }
            /* postcss-cleaner:ignore off */

            .baz{ }
        `,
        `
            /* postcss-cleaner:ignore on */
            .bar{ }
            /* postcss-cleaner:ignore off */
        `,
        {
            raw: '<div></div>'
        }
    );
});

/**
 * Logs
 */

it('log source files', () => {
    return runLog(
        '.foo{ } .bar{ } .baz{ }',
        ['=== Source files ===', 'source.html'],
        {
            sources: ['source.html'],
            log: {
                sourcesList: true
            }
        }
    );
});

it('log removed rules', () => {
    return runLog(
        '.foo{ } .bar{ } .baz{ }',
        ['Remove selector \'.bar\' line 1'],
        {
            raw:
                '<div class="foo"><p class="baz">Lorem ipsum dolor sit amet.</p></div>',
            log: {
                removedRules: true
            }
        }
    );
});

it('log ignored rules', () => {
    return runLog(
        '.foo{ } .bar{ } .baz{ }',
        ['Ignore selector \'.foo\' line 1', 'Ignore selector \'.baz\' line 1'],
        {
            raw: '<div></div>',
            ignore: ['.foo', '.baz'],
            log: {
                ignoredRules: true
            }
        }
    );
});
