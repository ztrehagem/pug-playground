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
      val: '"self"',
      mustEscape: false,
    }]
    replace({ ...node, attrs })
  }
}

function pushMixinAttrBlockToTag (node) {
  return {
    ...node,
    attributeBlocks: [
      ...node.attributeBlocks,
      {
        type: 'AttributeBlock',
        val: 'Object.keys(attributes).filter(key => key.startsWith("data-scope-")).reduce((attrs, key) => Object.assign(attrs, { [key]: "child" }), {})',
        line: node.line,
        column: node.column,
        filename: node.filename,
      },
      {
        type: 'AttributeBlock',
        val: '{ class: attributes.class }',
        line: node.line,
        column: node.column,
        filename: node.filename,
      }
    ]
  }
}

function searchRootTags (node, found) {
  switch (node.type) {
    case 'Tag':
      return found(node)
    case 'Mixin':
      return node.call ? found(node) : node
    case 'Conditional':
      return { ...node, consequent: searchRootTags(node.consequent, found), alternate: node.alternate ? searchRootTags(node.alternate, found) : undefined }
    default:
      return node.nodes ? { ...node, nodes: node.nodes.map(node => searchRootTags(node, found)) } : node
  }
}

const pushMixinAttrBlock = (pugOpts) => (node, replace) => {
  if (node.type === 'Mixin' && !node.call) {
    replace({ ...node, block: searchRootTags(node.block, pushMixinAttrBlockToTag) })
  }
}

module.exports = ({ verbose = false } = {}) => ({
  postParse (ast, pugOpts) {
    walk(ast, noteScope(pugOpts))
    if (verbose) console.log(inspect(ast))
    return ast
  },

  preCodeGen (ast, pugOpts) {
    walk(ast, pushScopeAttr(pugOpts))
    if (verbose) console.log(inspect(ast))
    walk(ast, pushMixinAttrBlock(pugOpts))
    if (verbose) console.log(inspect(ast))
    return ast
  },
})
