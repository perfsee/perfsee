import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { join } from 'path'

import ava, { TestFn } from 'ava'
import { v4 as uuid } from 'uuid'

import { RunnerConfig } from '@perfsee/job-runner-shared'

import { ConfigManager } from '..'

interface Context {
  manager: ConfigManager
}

const test = ava as TestFn<Context>
const testConfigDir = join(__dirname, '../.config/test')

test.before(() => {
  mkdirSync(testConfigDir, { recursive: true })
})

test.beforeEach((t) => {
  t.context.manager = new ConfigManager(join(testConfigDir, `config-${uuid()}.json`))
})

test.after(() => {
  rmSync(testConfigDir, { recursive: true })
})

test('should set default config if no config file exists', (t) => {
  const { manager } = t.context
  const config = manager.load()
  t.deepEqual(
    config,
    // @ts-expect-error default is private
    manager.default(),
  )
})

test('should be able to load config from disk', (t) => {
  const { manager } = t.context
  writeFileSync(
    manager.configFile,
    JSON.stringify({
      name: 'test',
    }),
    'utf-8',
  )

  const config = manager.load()
  t.assert(manager.loaded)
  t.is(config.name, 'test')
})

test('should be able to save config to disk', (t) => {
  const { manager } = t.context
  manager.load()
  manager.save()

  t.assert(existsSync(manager.configFile))
})

test('should throw if not loaded before patching', (t) => {
  const { manager } = t.context
  t.throws(() => manager.patch({ name: 'test' }))
})

test('should be able to patch config', (t) => {
  const { manager } = t.context
  const config = manager.load()
  manager.patch({ name: 'test', server: { url: 'server-url' }, runner: undefined }, false)

  t.assert(config === manager.load())
  t.is(config.name, 'test')
  t.is(config.server.url, 'server-url')
  // should not cover if property is nil
  t.assert(config.runner !== undefined)
})

test('should auto save after patching', (t) => {
  const { manager } = t.context
  manager.load()
  manager.patch({ name: 'test' })

  const config = JSON.parse(readFileSync(manager.configFile, 'utf-8')) as RunnerConfig
  t.is(config.name, 'test')
})

test('should tell invalid config', (t) => {
  const { manager } = t.context
  t.snapshot(manager.validate(), 'empty config')

  manager.load()
  // @ts-expect-error wrong config
  manager.patch({ runner: { concurrency: 'N' } })
  const result = manager.validate()
  t.snapshot(result, 'default config is invalid')
})

test('should tell valid config', (t) => {
  const { manager } = t.context
  manager.load()
  manager.patch({ server: { url: 'http://example.org', token: 'token' } })
  t.snapshot(manager.validate(), 'valid config')
})
