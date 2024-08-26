import { createReadStream } from 'fs'
import { parse, resolve } from 'path'

import test from 'ava'
import Sinon from 'sinon'

import { extractBundleFromStream, readStatsFile, resolveStatsPath } from '../bundle-extractor'
import { StatsParser } from '../stats-parser'
import { Logger } from '../stats-parser/types'
import { getConsoleLogger } from '../utils'

const extractTargetDir = resolve(__dirname, 'fixtures', 'temp')
const statsRegex = /^webpack-stats-(.*)\.(jsonr|mp)$/
const noLogger: Logger = Sinon.stub(getConsoleLogger())

// NOTE: these test cases heavily depend on the ordering, do not change the order or run them separately.

test.serial('should extract bundle tar correctly', async (t) => {
  const target = await extractBundleFromStream(
    createReadStream(resolve(__dirname, '.', 'fixtures', 'duplicate-libs.tar')),
    extractTargetDir,
  )

  t.snapshot(parse(target).base, 'perfsee bundle stats file')
})

test.serial('should read msgpack-ed stats file correctly', async (t) => {
  const statsFile = resolveStatsPath(extractTargetDir, statsRegex)
  if (!statsFile) {
    return t.pass()
  }

  t.snapshot((await readStatsFile(statsFile)).assets?.length, 'duplicate-libs stats')
})

test.serial('analysis - duplicate libs', async (t) => {
  const parser = await StatsParser.FromStatsFile(resolveStatsPath(extractTargetDir, statsRegex)!, noLogger)

  const task = parser.parse()
  await t.notThrowsAsync(task)
  const { report } = await task
  t.snapshot(
    report.entryPoints[0].audits.find((audit) => audit.id === 'duplicate-libraries'),
    'duplicate-libs audits',
  )
})

test.serial('analysis - perfsee archive', async (t) => {
  const parser = await StatsParser.FromStatsFile(
    await extractBundleFromStream(
      createReadStream(resolve(__dirname, '.', 'fixtures', 'perfsee.tar')),
      extractTargetDir,
    ),
    noLogger,
  )

  const task = parser.parse()
  await t.notThrowsAsync(task)
  const { report, moduleTree, moduleMap, moduleReasons } = await task

  const ignoreGzipReport = JSON.parse(
    JSON.stringify(report, (key, val) => {
      return key === 'gzip' ? 0 : val
    }),
  )

  const ignoreGzipTree = JSON.parse(
    JSON.stringify(moduleTree, (key, val) => {
      return key === 'gzip' ? 0 : val
    }),
  )
  t.snapshot(ignoreGzipReport, 'perfsee report')
  t.snapshot(ignoreGzipTree, 'perfsee module tree')
  t.snapshot(moduleMap, 'perfsee module map')
  t.snapshot(moduleReasons, 'perfsee module reasons')
})
