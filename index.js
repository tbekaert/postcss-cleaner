'use strict'

const postcss = require('postcss')
const glob = require('glob')
const fs = require('fs')

module.exports = postcss.plugin('postcss-cleaner', opts => {
  opts = opts || {}

  function log(type, args) {
    if (opts.log) {
      if (
        (type === 'sourcesList' && opts.log.sourcesList) ||
        (type === 'removedRules' && opts.log.removedRules) ||
        (type === 'ignoredRules' && opts.log.ignoredRules)
      ) {
        // console.log(...args)
        console.log(args.join('\n'))
      }
    }
  }

  function flatten(arr) {
    return arr.reduce(
      (a, b) => (Array.isArray(b) ? a.concat(flatten(b)) : a.concat(b)), []
    )
  }

  function replace(str, arr, repl) {
    return arr.reduce((result, reg) => result.replace(reg, repl), str)
  }

  RegExp.escape = s => s.replace(/[-[\]{}()*+!<=:?./\\^$|#\s,]/g, '\\$&')

  function getFilesContent() {
    let patterns = flatten(arguments[0])

    log('sourcesList', ['=== Source files ==='])

    return flatten(
      patterns.map(pattern => {
        return glob.sync(pattern).map(file => {
          log('sourcesList', [file])
          let content = fs.readFileSync(file)
          return content
        })
      })
    ).join('\n')
  }

  if (Array.isArray(opts.sources)) {
    opts.raw = getFilesContent(opts.sources)
  }
  opts.ignore = [/[\d]*%/].concat(opts.ignore ? opts.ignore : [])

  return function (root, result) {
    let isActive = true
    if (!opts.raw) {
      result.warn(
        'Array of sources or raw source is ' +
        'necessary to run this plugin. See doc.'
      )
      return
    }
    root.walk(rule => {
      if (
        rule.type === 'comment' &&
        rule.text.indexOf('postcss-cleaner:ignore') > -1
      ) {
        isActive = !(rule.text.indexOf('on') > -1)
      }
      if (rule.type === 'rule') {
        if (!isActive) {
          log('ignoredRules', [
            `Ignore selector '${ rule.selectors }' line ${
              rule.source.start.line
            }`
          ])
        } else {
          let selectors = rule.selector
            .replace(/[\n]/, '')
            .split(',')
          let testSelectors = selectors.map(s => {
            s = replace(
              s, [
                /\./g,
                /#/g,
                /=/g,
                /(\[[^=]*=)/g,
                /\[/g,
                /\]/g,
                />/g,
                /\+/g,
                /~/g
              ],
              ' '
            )
            s = replace(
              s, [
                /\//g,
                /"/g,
                /\n/g,
                /\t/g,
                /\*/g,
                /:not\([^)]*\)/g,
                /(::?[^\s:]*)/g
              ],
              ''
            )
            s = s
              .split(' ')
              .filter(sel => sel !== '' && !/^[0-9]/.test(sel))

            return s
          })

          let index = testSelectors.length - 1
          while (index >= 0) {
            let sel = testSelectors[index]

            let isIgnored = opts.ignore
              .map(r => {
                return typeof r === 'string' ? selectors[index].indexOf(r) >= 0 : r.test(selectors[index])
              })
              .reduce((r, b) => r || b, false)

            if (!isIgnored) {
              let isFound = sel
                .map(s => {
                  let reg = new RegExp(
                    '(\\.|#| |"|\'|<|\\[)(' +
                    RegExp.escape(s) +
                    ')(\\.|#| |"|\'|>|\\]|\\n|[\\d\\w])',
                    'g'
                  )

                  return reg.exec(opts.raw) !== null
                })
                .reduce((s, b) => (!s ? s : b), true)

              if (!isFound) {
                log('removedRules', [
                  `Remove selector '${
                    selectors[index]
                  }' line ${ rule.source.start.line }`
                ])

                selectors.splice(index, 1)
              }
            } else {
              log('ignoredRules', [
                `Ignore selector '${ selectors[index] }' line ${
                  rule.source.start.line
                }`
              ])
            }

            index--
          }

          rule.selector = selectors.map(s => s.trim()).join(', ')

          if (rule.selector === '') rule.remove()
        }
      }
    })
  }
})
