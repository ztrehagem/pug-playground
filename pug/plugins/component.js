const walk = require('pug-walk')

const inspect = (obj) => require('util').inspect(obj, { depth: null })

const lexComponent = () => (lexer) => {
  let captures = /^component +([-\w]+)(?: *\((.*)\))? */.exec(lexer.input)
  if (captures) {
    lexer.consume(captures[0].length)
    const tok = lexer.tok('component', captures[1])
    tok.args = captures[2] || null
    lexer.incrementColumn(captures[0].length)
    lexer.tokens.push(lexer.tokEnd(tok))
    return true
  }
}

const parseComponent = () => (parser) => {
  const tok = parser.expect('component')
  const name = tok.val
  const args = tok.args

  if ('indent' == parser.peek().type) {
    parser.inMixin++
    const mixin = {
      type: 'Mixin',
      component: true,
      name,
      args,
      block: parser.block(),
      call: false,
      line: tok.loc.start.line,
      column: tok.loc.start.column,
      filename: parser.filename,
    }
    parser.inMixin--
    return mixin
  } else {
    parser.error('MIXIN_WITHOUT_BODY', 'Component ' + name + ' declared without body', tok)
  }
}

const transformComponent = (pugOpts) => (node, replace) => {
  if (node.type === 'Mixin' && node.component) {
    const block = node.block
    const nodes = block.nodes.map((node) => {
      if (node.type === 'Tag') {
        node.attributeBlocks.push({
          type: 'AttributeBlock',
          val: 'attributes',
          line: node.line,
          column: node.column,
          filename: node.filename,
        })
      }
      return node
    })
    replace({
      ...node,
      block: {
        ...block,
        nodes,
      },
    })
  }
}

module.exports = ({ verbose = false } = {}) => ({
  lex: {
    mixin: lexComponent(),
  },
  parse: {
    expressionTokens: {
      component: parseComponent(),
    },
  },
  postParse (ast, pugOpts) {
    if (verbose) console.log(inspect(ast))
    walk(ast, transformComponent(pugOpts))
    if (verbose) console.log(inspect(ast))
    return ast
  },
})
