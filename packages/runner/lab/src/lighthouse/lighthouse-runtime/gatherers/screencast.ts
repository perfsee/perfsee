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

import { promises as fs } from 'fs'
import { join } from 'path/posix'

import ffmpeg from 'fluent-ffmpeg'
import Jimp from 'jimp'
import { noop } from 'lodash'

import { logger } from '@perfsee/job-runner-shared'

import { GathererInstance } from './gatherer'

let available = false

try {
  const { path } = require('@ffmpeg-installer/ffmpeg')
  ffmpeg.setFfmpegPath(path)
  available = true
} catch {
  console.warn('ffmpeg was available for current platform')
}

interface ScreencastFrame {
  timestamp: number
  data: Buffer
}

function getStartTime() {
  const navigationTiming = window.performance
    .getEntries()
    .find((entry) => entry.entryType === 'navigation') as PerformanceNavigationTiming

  return (window.performance.timeOrigin + navigationTiming.startTime) / 1000
}

async function getWhiteScreen(width: number, height: number): Promise<Buffer> {
  const jpg = new Jimp(width, height, '#FFFFFF')
  return jpg.getBufferAsync(Jimp.MIME_JPEG)
}

export class Screencast extends GathererInstance {
  meta = { supportedModes: ['navigation' as const, 'timespan' as const] }
  private readonly frames: ScreencastFrame[] = []

  async startInstrumentation(ctx: LH.Gatherer.Context) {
    if (!available) {
      return
    }

    const startTime = Date.now()
    const driver = ctx.driver.defaultSession

    driver.on('Page.screencastFrame', (e) => {
      this.frames.push({
        timestamp: /* in seconds */ e.metadata.timestamp!,
        data: Buffer.from(e.data, 'base64'),
      })
      driver.sendCommand('Page.screencastFrameAck', { sessionId: e.sessionId }).catch(noop)
      // stop screencast if the page takes more then 20 seconds to be loaded
      // or, more then 150 frames have been taken in 10 seconds (30+ FPS)
      if (Date.now() - startTime > /* 20s */ 15000 || (this.frames.length >= 150 && Date.now() - startTime > 10000)) {
        driver.sendCommand('Page.stopScreencast').catch(noop)
      }
    })

    await driver.sendCommand('Page.startScreencast', {
      format: 'jpeg',
      everyNthFrame: ctx.gatherMode === 'navigation' ? 2 : 1,
      quality: 10,
    })
  }

  async stopInstrumentation(ctx: LH.Gatherer.Context) {
    const driver = ctx.driver.defaultSession
    await driver.sendCommand('Page.stopScreencast')
  }

  async getArtifact(ctx: LH.Gatherer.Context) {
    if (!available) {
      return null
    }

    let frames = this.frames

    try {
      if (ctx.gatherMode === 'navigation') {
        const driver = ctx.driver
        const startTime /* in seconds */ = await driver.executionContext.evaluate(getStartTime, { args: [] })
        frames = frames.filter(({ timestamp }) => timestamp > startTime)
        const { width, height } = ctx.settings.screenEmulation
        const whiteScreen = await getWhiteScreen(width, height)
        frames.push({ data: whiteScreen, timestamp: startTime })

        if (this.frames.length < 2) {
          return null
        }
      }
    } catch (e) {
      logger.error('Failed to cut extra screencast frames', { error: e })
    }

    if (this.frames.length < 1) {
      return null
    }

    frames = frames.sort((a, b) => a.timestamp - b.timestamp)
    const dir = join(process.cwd(), `tmp/lighthouse-screencast-${Date.now()}`)
    await fs.mkdir(dir, { recursive: true })
    const writeResults = await Promise.allSettled(
      frames.map(async (frame) => {
        return fs.writeFile(join(dir, `${frame.timestamp}.jpg`), frame.data).then(() => frame.timestamp)
      }),
    )

    let previousTimestamp: null | number = null
    const lines: string[] = []
    for (const result of writeResults) {
      if (result.status === 'fulfilled') {
        if (previousTimestamp) {
          lines.push(`duration ${result.value - previousTimestamp}`)
        }
        lines.push(`file '${result.value}.jpg'`)
        previousTimestamp = result.value
      }
    }

    const inputFile = join(dir, 'input.txt')
    const videoFile = join(dir, 'screencast.mp4')
    await fs.writeFile(inputFile, lines.join('\n'), 'utf-8')

    return new Promise<LH.ScreencastGathererResult>((resolve, reject) => {
      const { width, height } = ctx.settings.screenEmulation
      const cmd = ffmpeg()
        .addInput(inputFile)
        .addInputOption('-f', 'concat')
        .outputOptions(['-preset', 'ultrafast'])
        .outputOptions(['-pix_fmt', 'yuv420p'])
        .size(`${Math.ceil(width / 2)}x${Math.ceil(height / 2)}`)
        .addOptions(['-threads', '2'])

      cmd
        .on('start', (command) => {
          logger.verbose(`concat frames started: ${command}`)
        })
        .on('end', () => {
          logger.verbose(`Finish concatenating screencast frames.`)
          resolve({
            path: videoFile,
            firstFrameTime: frames[0].timestamp,
            lastFrameTime: frames[frames.length - 1].timestamp,
          })
        })
        .on('error', (err) => {
          logger.error('error concat frames', err)
          cmd.kill('SIGKILL')
          reject(err)
        })
        .save(videoFile)
    })
  }
}
