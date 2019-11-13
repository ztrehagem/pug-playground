const { inspect } = require('util')

function scopedHtml (parsed, options) {
  console.log('plugin!', inspect(parsed, { depth: null }), options)
  return parsed
}

exports.postParse = scopedHtml
