const css = require('css')

module.exports = (text, attrs) => {
  const parsed = css.parse(text)
  parsed.stylesheet.rules.forEach((rule) => {
    if (!rule.selectors) return
    rule.selectors.push(`${rule.selectors.pop()}[data-scope-${attrs.scope}]`)
  })
  return css.stringify(parsed)
}
