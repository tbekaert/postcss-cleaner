'use strict'

const postcss = require('postcss')

const plugin = require('./')

/**
 * Options
 */

it('return same CSS and a warning if no sources provided', () => {
  let input = 'a{ }'
  let output = 'a{ }'
  let opts = {}

  return postcss([plugin(opts)])
    .process(input, {
      from: undefined
    })
    .then(result => {
      expect(result.css).toEqual(output)
      expect(result.warnings().length).toBeGreaterThan(0)
    })
})

it('return same CSS and a warning if opts.sources is not an array', () => {
  let input = 'a{ }'
  let output = 'a{ }'
  let opts = {
    sources: 'lorem'
  }

  return postcss([plugin(opts)])
    .process(input, {
      from: undefined
    })
    .then(result => {
      expect(result.css).toEqual(output)
      expect(result.warnings().length).toBeGreaterThan(0)
    })
})

it('remove rules based on sources array', () => {
  let input = '.foo{ } .bar{ } .baz{ }'
  let output = '.foo{ } .bar{ }'
  let opts = {
    sources: ['source.html']
  }

  return postcss([plugin(opts)])
    .process(input, {
      from: undefined
    })
    .then(result => {
      expect(result.css).toEqual(output)
      expect(result.warnings()).toHaveLength(0)
    })
})

/**
 * Removal
 */

it('remove unused css in html sources', () => {
  let input = '.foo{ } .bar{ } .baz{ }'
  let output = '.foo{ } .baz{ }'
  let opts = {
    raw: `
          <div class="foo">
            <p class="baz">Lorem</p>
          </div>
        `
  }

  return postcss([plugin(opts)])
    .process(input, {
      from: undefined
    })
    .then(result => {
      expect(result.css).toEqual(output)
      expect(result.warnings()).toHaveLength(0)
    })
})

it('remove unused css in slim sources', () => {
  let input = '.foo{ } .bar{ } .baz{ }'
  let output = '.foo{ } .bar{ }'
  let opts = {
    raw: `
            div.foo
              p class="bar"
                | Lorem
        `
  }

  return postcss([plugin(opts)])
    .process(input, {
      from: undefined
    })
    .then(result => {
      expect(result.css).toEqual(output)
      expect(result.warnings()).toHaveLength(0)
    })
})

it('remove unused css in js sources', () => {
  let input = '.foo{ } .bar{ } .baz{ }'
  let output = '.bar{ }'
  let opts = {
    raw: 'document.querySelectorAll(".bar")'
  }

  return postcss([plugin(opts)])
    .process(input, {
      from: undefined
    })
    .then(result => {
      expect(result.css).toEqual(output)
      expect(result.warnings()).toHaveLength(0)
    })
})

it('remove unused selector in rule', () => {
  let input = '.foo, .bar, .baz{ }'
  let output = '.foo, .bar{ }'
  let opts = {
    raw: `
          <div class="foo">
            <p class="bar">Lorem</p>
          </div>
        `
  }

  return postcss([plugin(opts)])
    .process(input, {
      from: undefined
    })
    .then(result => {
      expect(result.css).toEqual(output)
      expect(result.warnings()).toHaveLength(0)
    })
})

it('remove unused multi selector in rule', () => {
  let input = 'th td, tr td{ }'
  let output = 'tr td{ }'
  let opts = {
    raw: `
          <table>
            <tr>
              <td>Cell</td>
            </tr>
          </table
        `
  }

  return postcss([plugin(opts)])
    .process(input, {
      from: undefined
    })
    .then(result => {
      expect(result.css).toEqual(output)
      expect(result.warnings()).toHaveLength(0)
    })
})

it('remove unused selector if any child selector is not found', () => {
  let input = '.foo .bar, .foo .baz{ }'
  let output = '.foo .baz{ }'
  let opts = {
    raw: `
          <div class="foo">
            <p class="baz">Lorem</p>
          </div>
        `
  }

  return postcss([plugin(opts)])
    .process(input, {
      from: undefined
    })
    .then(result => {
      expect(result.css).toEqual(output)
      expect(result.warnings()).toHaveLength(0)
    })
})

it('remove unused selector if it is not found', () => {
  let input = '.sm-foo, .foo .bar{ } .md-foo{ }'
  let output = '.md-foo{ }'
  let opts = {
    raw: '<div class="md-foo bar"></div>'
  }

  return postcss([plugin(opts)])
    .process(input, {
      from: undefined
    })
    .then(result => {
      expect(result.css).toEqual(output)
      expect(result.warnings()).toHaveLength(0)
    })
})

/**
 * Ignorance
 */

it('ignore rule based on string', () => {
  let input = '.foo{ } .bar{ } .baz{ }'
  let output = '.bar{ }'
  let opts = {
    raw: `
          <div class="a">
            <p class="b">Lorem</p>
          </div>
        `,
    ignore: ['.bar']
  }

  return postcss([plugin(opts)])
    .process(input, {
      from: undefined
    })
    .then(result => {
      expect(result.css).toEqual(output)
      expect(result.warnings()).toHaveLength(0)
    })
})

it('ignore rule based on regex', () => {
  let input = '.foo{ } .bar{ } .baz{ }'
  let output = '.bar{ } .baz{ }'
  let opts = {
    raw: `
          <div class="a">
            <p class="b">Lorem</p>
          </div>
        `,
    ignore: [/ba/]
  }

  return postcss([plugin(opts)])
    .process(input, {
      from: undefined
    })
    .then(result => {
      expect(result.css).toEqual(output)
      expect(result.warnings()).toHaveLength(0)
    })
})

it('ignore rule based on comment', () => {
  let input = `
  .foo{ }

  /* postcss-cleaner:ignore on */
  .bar{ }
/* postcss-cleaner:ignore off */

  .baz{ }
`
  let output = `
  /* postcss-cleaner:ignore on */
  .bar{ }
/* postcss-cleaner:ignore off */
`
  let opts = {
    raw: '<div></div>'
  }

  return postcss([plugin(opts)])
    .process(input, {
      from: undefined
    })
    .then(result => {
      expect(result.css).toEqual(output)
      expect(result.warnings()).toHaveLength(0)
    })
})

/**
 * Logs
 */

it('log source files', () => {
  let input = '.foo{ } .bar{ } .baz{ }'
  let output = ['=== Source files ===', 'source.html']
  let opts = {
    sources: ['source.html'],
    log: {
      sourcesList: true
    }
  }
  let logs = []

  function storeLog(inputs) {
    logs.push(inputs)
  }
  console.log = jest.fn(storeLog)

  return postcss([plugin(opts)])
    .process(input, {
      from: undefined
    })
    .then(result => {
      expect(logs.join('\n')).toBe(output.join('\n'))
      expect(result.warnings()).toHaveLength(0)
    })
})

it('log removed rules', () => {
  let input = '.foo{ } .bar{ } .baz{ }'
  let output = ['Remove selector \'.bar\' line 1']
  let opts = {
    raw: '<div class="foo"><p class="baz">Lorem ipsum dolor sit amet.</p></div>',
    log: {
      removedRules: true
    }
  }
  let logs = []

  function storeLog(inputs) {
    logs.push(inputs)
  }
  console.log = jest.fn(storeLog)

  return postcss([plugin(opts)])
    .process(input, {
      from: undefined
    })
    .then(result => {
      expect(logs.join('\n')).toBe(output.join('\n'))
      expect(result.warnings()).toHaveLength(0)
    })
})

it('log ignored rules', () => {
  let input = '.foo{ } .bar{ } .baz{ }'
  let output = ['Ignore selector \'.foo\' line 1', 'Ignore selector \'.baz\' line 1']
  let opts = {
    raw: '<div></div>',
    ignore: ['.foo', '.baz'],
    log: {
      ignoredRules: true
    }
  }
  let logs = []

  function storeLog(inputs) {
    logs.push(inputs)
  }
  console.log = jest.fn(storeLog)

  return postcss([plugin(opts)])
    .process(input, {
      from: undefined
    })
    .then(result => {
      expect(logs.join('\n')).toBe(output.join('\n'))
      expect(result.warnings()).toHaveLength(0)
    })
})
