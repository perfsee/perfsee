/* eslint-disable no-console */
const runSerialTestCases = process.argv.includes('--serial') || process.argv.includes('-s')

if (runSerialTestCases) {
  startServer()
}

module.exports = {
  extensions: ['ts', 'tsx'],
  require: ['./tools/ava.setup'],
  environmentVariables: {
    TS_NODE_PROJECT: './tsconfigs/tsconfig.cjs.json',
  },
  timeout: '300s',
  files: runSerialTestCases
    ? ['packages/**/*.spec.serial.{ts,tsx}', 'packages/**/*.spec.e2e.{ts,tsx}']
    : ['packages/**/*.spec.{ts,tsx}'],
}

function startServer() {
  const { execSync, fork } = require('child_process')
  const path = require('path')

  console.info('initializing testing database...')
  execSync(
    'yarn typeorm query "CREATE DATABASE IF NOT EXISTS perfsee_testing;" && yarn typeorm migration:run && yarn typeorm query "SET GLOBAL FOREIGN_KEY_CHECKS = 0;"',
    {
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'test',
      },
    },
  )

  const server = fork(`${path.resolve(__dirname, 'tools/e2e-server.entry.js')}`, {
    stdio: 'inherit',
  })

  server.unref()
  server.channel.unref()

  process.on('beforeExit', () => {
    // `server.kill()` will prevent v8 from generate coverage data
    // replace it with AbortController after switching to node@16
    server.send('exit')
  })

  // wait on server ready
  console.log('waiting for e2e server ready')
  try {
    execSync('wait-on tcp:3001', {
      shell: true,
      timeout: 1000 * 60 /* 30s */,
    })
    console.log('e2e server ready, start testing')
  } catch (e) {
    console.error('start e2e server timeout, exiting', e)
    server.kill()
    process.exit(1)
  }
}
