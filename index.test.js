var postcss = require('postcss');

var plugin = require('./');

function run(input, output, opts) {
    return postcss([plugin(opts)])
        .process(input)
        .then(result => {
            expect(result.css).toEqual(output);
            expect(result.warnings().length).toBe(0);
        });
}

function runError(input, output, opts) {
    return postcss([plugin(opts)])
        .process(input)
        .then(result => {
            expect(result.css).toEqual(output);
            expect(result.warnings().length).toBeGreaterThan(0);
        });
}

/**
 * Options
 */

it('return same CSS and a warning if no sources provided', () => {
    return runError('a{ }', 'a{ }', {});
});

it('return same CSS and a warning if opts.sources is not an array', () => {
    return runError('a{ }', 'a{ }', {
        sources: 'lorem'
    });
});

/**
 * Removal
 */

it('remove unused css in html sources', () => {
    return run('.foo{ } .bar{ } .baz{ }', '.foo{ } .baz{ }', {
        raw: '<div class="foo"><p class="baz">Lorem</p></div>'
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

/**
 * Ignorance
 */

it('ignore rule based on string', () => {
    return run('.foo{ } .bar{ } .baz{ }', '.bar{ }', {
        raw: '<div class="a"><p class="b">Lorem</p></div>',
        ignore: ['.bar']
    });
});

it('ignore rule based on regex', () => {
    return run('.foo{ } .bar{ } .baz{ }', '.bar{ } .baz{ }', {
        raw: '<div class="a"><p class="b">Lorem</p></div>',
        ignore: [/ba/]
    });
});
