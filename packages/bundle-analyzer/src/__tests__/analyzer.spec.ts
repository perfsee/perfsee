import { createReadStream } from 'fs'
import { parse, resolve } from 'path'

import test from 'ava'
import Sinon from 'sinon'

import { extractBundleFromStream, readStatsFile, resolveStatsPath } from '../bundle-extractor'
import { StatsParser } from '../stats-parser'
import { Logger } from '../stats-parser/types'
import { getConsoleLogger } from '../utils'

const extractTargetDir = resolve(__dirname, 'fixtures', 'temp')
const statsRegex = /^webpack-stats-(.*)\.mp$/
const noLogger: Logger = Sinon.stub(getConsoleLogger())

// NOTE: these test cases heavily depend on the ordering, do not change the order or run them separately.

test.serial('should extract bundle tar correctly', async (t) => {
  const target = await extractBundleFromStream(
    createReadStream(resolve(__dirname, '.', 'fixtures', 'duplicate-libs.tar')),
    extractTargetDir,
  )

  t.snapshot(parse(target).base, 'perfsee bundle stats file')
})

test.serial('should read msgpack-ed stats file correctly', (t) => {
  const statsFile = resolveStatsPath(extractTargetDir, statsRegex)
  if (!statsFile) {
    return t.pass()
  }

  t.snapshot(readStatsFile(statsFile).assets?.length, 'duplicate-libs stats')
})

test.serial('analysis - duplicate libs', async (t) => {
  const parser = StatsParser.FromStatsFile(resolveStatsPath(extractTargetDir, statsRegex)!, noLogger)

  const task = parser.parse()
  await t.notThrowsAsync(task)
  const { report } = await task
  t.snapshot(
    report.entryPoints[0].audits.find((audit) => audit.id === 'duplicate-libraries'),
    'duplicate-libs audits',
  )
})

test.serial('analysis - perfsee archive', async (t) => {
  const parser = StatsParser.FromStatsFile(
    await extractBundleFromStream(
      createReadStream(resolve(__dirname, '.', 'fixtures', 'perfsee.tar')),
      extractTargetDir,
    ),
    noLogger,
  )

  const task = parser.parse()
  await t.notThrowsAsync(task)
  const { report, moduleTree } = await task
  t.snapshot(report, 'perfsee report')
  t.snapshot(moduleTree, 'perfsee module tree')
})
