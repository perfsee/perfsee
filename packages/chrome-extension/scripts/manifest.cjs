const fs = require('fs')
const path = require('path')

const packageJson = require('../package.json')

module.exports = function () {
  const filePath = '../src/manifest.json'
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, filePath), 'utf8'))

  manifest.version = packageJson.version

  return JSON.stringify(manifest, null, 4)
}
