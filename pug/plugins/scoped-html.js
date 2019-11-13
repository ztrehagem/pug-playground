// const { inspect } = require('util')
const crypt = require('crypto')

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

function canBeScoped (node, options) {
  return options.src && (
    (node.type === 'Tag' && !ignoreTags.includes(node.name)) ||
    (node.type === 'Mixin' && node.call)
  )
}

function visitNode (node, options) {
  if (canBeScoped(node, options)) {
    const digest = crypt.createHash('md5').update(options.src).digest('hex')
    node.attrs.push({
      name: `data-scope-${digest.slice(0, 8)}`,
      val: '""',
      mustEscape: false,
    })
  }
  const nodes = (node.block || {}).nodes || []
  nodes.forEach(node => visitNode(node, options))
}

function scopedHtml (parsed, options) {
  if (parsed.type === 'Block') {
    (parsed.nodes || []).forEach(node => visitNode(node, options))
  } else {
    visitNode(parsed, options)
  }
  return parsed
}

exports.postParse = scopedHtml
