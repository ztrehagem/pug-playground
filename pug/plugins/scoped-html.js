const crypt = require('crypto')
const walk = require('pug-walk')

const ignoreTags = [
  'html',
  'head',
  'meta',
  'title',
  'base',
  'link',
  'body',
  'script',
]

const inspect = (obj) => require('util').inspect(obj, { depth: null })

const genScope = (src) => crypt.createHash('md5').update(src).digest('hex').slice(0, 8)

const noteScope = (pugOpts) => {
  const scope = genScope(pugOpts.src)
  return (node, replace) => {
    switch (node.type) {
      case 'Tag':
        if (ignoreTags.includes(node.name)) break
        replace({ ...node, scope })
        break

      case 'Mixin':
        if (!node.call) break
        replace({ ...node, scope })
        break
    }
  }
}

const pushScopeAttr = (pugOpts) => (node, replace) => {
  if (node.scope) {
    const attrs = [...node.attrs, {
      name: `data-scope-${node.scope}`,
      val: '""',
      mustEscape: false,
    }]
    replace({ ...node, attrs })
  }
}

module.exports = ({ verbose = false } = {}) => ({
  postParse (ast, pugOpts) {
    walk(ast, noteScope(pugOpts))
    // if (verbose) console.log(inspect(ast))
    return ast
  },

  preCodeGen (ast, pugOpts) {
    walk(ast, pushScopeAttr(pugOpts))
    if (verbose) console.log(inspect(ast))
    return ast
  },

  postCodeGen (js, pugOpts) {
    if (verbose) console.log(inspect(js))
    return js
  },
})
