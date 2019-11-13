const path = require('path')
const fs = require('fs')
const pug = require('pug')
const glob = require('glob')
const del = require('del')

const scopedHtml = require('./pug/plugins/scoped-html')

const srcDir = path.resolve(__dirname, './src/pages')
const outDir = path.resolve(__dirname, './dist')

del.sync(path.resolve(outDir, '**/*'))

const globed = glob.sync('**/*.pug', { cwd: srcDir })

globed.forEach((filePath) => {
  const srcFilePath = path.resolve(srcDir, filePath)
  const outFilePath = path.resolve(outDir, filePath).replace(/\.pug$/, '.html')
  const render = pug.compileFile(srcFilePath, {
    plugins: [
      scopedHtml,
    ],
  })
  const html = render()
  fs.writeFileSync(outFilePath, html)
})