/*
Copyright 2022 ByteDance and/or its affiliates.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

const crypto = require('crypto')
const fs = require('fs')
const { builtinModules } = require('module')
const path = require('path')

const { fdir } = require('fdir')

const cliDeps = [
  path.resolve(__dirname, './cli'),
  path.resolve(__dirname, './webpack'),
  path.resolve(__dirname, './codegen'),
  path.resolve(__dirname, './utils'),
  path.resolve(__dirname, '../node_modules/@perfsee/webpack/src'),
]
const cliSrc = path.resolve(__dirname, './cli/index.ts')
const cliDist = `./cli.generated.${cliHash()}.js`
const cliAbsDist = path.resolve(__dirname, cliDist)

function cliHash() {
  const lockHash = crypto.createHash('sha256').update(fs.readFileSync('yarn.lock')).digest('hex').substring(0, 5)
  const hasher = crypto.createHash('sha256')

  cliDeps.forEach((cliDep) => {
    new fdir()
      .withFullPaths()
      .crawl(cliDep)
      .sync()
      .forEach((filename) => {
        hasher.update(fs.readFileSync(filename))
      })
  })
  return lockHash + hasher.digest('hex').substring(0, 5)
}

/**
 *
 * @param {string} from
 * @param {string} requirePath
 */
function resolvePackage(from, requirePath) {
  if (!from.endsWith(path.sep + 'node_modules')) {
    from = path.join(path.parse(from).dir, './node_modules')
  }

  if (!requirePath.startsWith('@') && requirePath.includes(path.sep)) {
    requirePath = requirePath.split(path.sep)[0]
  }

  while (from.startsWith(process.cwd())) {
    const pkgJsonPath = path.join(from, requirePath, 'package.json')
    if (fs.existsSync(pkgJsonPath)) {
      return pkgJsonPath
    }

    from = path.join(path.parse(from.substring(0, from.lastIndexOf(path.sep + 'node_modules'))).dir, './node_modules')
  }
}

function cleanup() {
  console.info('Cleaning up old builds...')
  const dir = path.dirname(cliAbsDist)
  fs.readdirSync(dir)
    .filter((desc) => /^cli\.generated\./.test(desc))
    .forEach((desc) => {
      fs.rmSync(path.join(dir, desc))
    })
}

function build() {
  cleanup()
  console.info('Building CLI...')
  const esbuild = require('esbuild')

  /**
   * @type { import('esbuild').Plugin}
   */
  const externalPlugin = {
    name: 'external-plugin',
    setup: (build) => {
      const builtins = new Set([
        ...builtinModules,
        'emitter',
        'fsevents',
        'pnpapi',
        'vite',
        'webpack',
        'rollup',
        'esbuild',
        '@swc/core',
      ])
      build.onResolve({ filter: /.*/ }, ({ path: requirePath, kind, importer }) => {
        if (builtins.has(requirePath) || requirePath.startsWith('node:') || kind === 'require-resolve') {
          return {
            external: true,
          }
        }

        if (/^@(perfsee)\//.test(requirePath)) {
          return {
            external: false,
          }
        }

        if (!/^[\w@]/.test(requirePath)) {
          return {
            external: false,
            namespace: 'bundled',
          }
        }

        try {
          const pkgJsonPath = resolvePackage(importer, requirePath)

          if (pkgJsonPath) {
            const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'))

            if (pkgJson.type === 'module' || pkgJsonPath.match(/node_modules/g).length > 1) {
              return {
                external: false,
                namespace: 'bundled',
              }
            }
          }
          // eslint-disable-next-line no-empty
        } catch {}
        if (!importer) {
          return {
            external: false,
          }
        }

        return {
          external: true,
        }
      })

      build.onLoad({ filter: /.(js|ts)$/ }, ({ path: filePath }) => {
        let contents = fs.readFileSync(filePath, 'utf8')
        let loader = path.extname(filePath).substring(1)
        if (loader === 'cjs' || loader === 'mjs') {
          loader = 'js'
        }
        const dirname = path.posix.dirname(filePath)
        contents = contents
          .replace(/([^\w'"_.\s])__dirname([^\w_'"])/g, `$1"${dirname}"$2`)
          .replace(/([^\w'"_.\s])__filename([^\w_'"])/g, `$1"${filePath}"$2`)
        return {
          contents,
          loader,
        }
      })
    },
  }

  return esbuild.build({
    entryPoints: [cliSrc],
    bundle: true,
    platform: 'node',
    target: 'node14',
    outfile: cliAbsDist,
    plugins: [externalPlugin],
    sourcemap: true,
  })
}

const preparasion = fs.existsSync(cliAbsDist) ? Promise.resolve() : build()

preparasion.then(() => {
  require(cliDist)
})
