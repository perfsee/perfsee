const fs = require('fs')
const path = require('path')

const esbuild = require('esbuild')

const manifest = require('./manifest.cjs')

const { NODE_ENV } = process.env
const watch = NODE_ENV !== 'production'

const indir = path.join(__dirname, '../src')

function copyFiles(src, dest) {
  fs.mkdirSync(dest, { recursive: true })

  if (fs.statSync(src).isDirectory()) {
    fs.readdirSync(src).forEach((p) => copyFiles(path.join(src, p), path.join(dest, path.basename(src))))
  } else {
    fs.copyFileSync(src, path.join(dest, path.basename(src)))
  }
}

async function build() {
  const outdir = path.join(__dirname, `/../dist`)

  if (fs.existsSync(outdir)) {
    fs.rmSync(outdir, { recursive: true })
  }
  fs.mkdirSync(outdir, { recursive: true })
  fs.writeFileSync(outdir + '/manifest.json', manifest())

  copyFiles(path.join(indir, './popup/popup.html'), outdir)
  copyFiles(path.join(indir, './popup/popup.css'), outdir)
  copyFiles(path.join(indir, './options/options.html'), outdir)
  copyFiles(path.join(indir, './options/options.css'), outdir)
  copyFiles(path.join(indir, 'manifest.json'), outdir)
  copyFiles(path.join(indir, '../../../assets/favicon.ico'), outdir)

  // build bundle
  const result = await esbuild.build({
    entryPoints: [
      path.join(indir, './popup/popup.ts'),
      path.join(indir, './options/options.ts'),
      path.join(indir, './background.ts'),
    ],
    plugins: [
      {
        // FIXME: That's a temporary fix.
        // Subscriber doesn't use for socket.io-client, however esbuild doesn't cut off it
        // since it is CommonJS module. Migration from socket.io v2 to v4 should potentially
        // fix the issue since v4 uses ESM
        name: 'cut-off-socket.io',
        setup({ onLoad }) {
          onLoad({ filter: /socket\.io-client/ }, () => ({
            contents: 'export default {}',
          }))
        },
      },
    ],
    format: 'esm',
    bundle: true,
    // minify: true,
    write: false,
    outdir,
    define: {
      global: 'window',
    },
    loader: {
      '.png': 'dataurl',
      '.svg': 'dataurl',
    },
    external: [
      'stream',
      'fs',
      'child_process',
      'path',
      'os',
      'constants',
      'net',
      'dns',
      'tls',
      'http',
      'https',
      'crypto',
      'module',
      'domain',
      'zlib',
      'readline',
    ],
  })

  result.outputFiles.forEach((file) => {
    fs.writeFileSync(path.join(outdir, path.basename(file.path)), file.contents)
  })
}

const buildAll = async function () {
  console.log('Building extension') // eslint-disable-line no-console

  try {
    await build()
  } catch (e) {
    if (!/esbuild/.test(e.stack)) {
      console.error(e) // eslint-disable-line no-console
    }

    return
  }

  console.log('  OK') // eslint-disable-line no-console
}

async function main() {
  await buildAll()

  if (watch) {
    const lastChange = new Map()

    fs.watch(indir, { recursive: true }, function (_, fn) {
      const mtime = Number(fs.statSync(path.join(indir, fn)).mtime)

      // avoid build when file doesn't changed but event is received
      if (lastChange.get(fn) !== mtime) {
        lastChange.set(fn, mtime)
        buildAll()
      }
    })
  }
}

main()
