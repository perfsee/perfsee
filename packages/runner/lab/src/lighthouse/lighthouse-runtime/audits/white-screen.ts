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

/// <reference types="lighthouse" />

import ffmpeg from 'fluent-ffmpeg'
//@ts-expect-error
import Audit from 'lighthouse/lighthouse-core/audits/audit'

import { logger } from '@perfsee/job-runner-shared'

// Minimum detected white duration expressed in seconds
const MIN_DURATION = 0

// The threshold for considering a picture "white".
const PICTURE_WHITE_RATIO_TH = 0.01

// The threshold expresses the maximum pixel luminance value for which a pixel is considered "white".
const PIXEL_WHITE_TH = 0.95

export class WhiteScreen extends Audit {
  static get meta(): LH.Audit.Meta {
    return {
      id: 'white-screen',
      title: 'White Screen Duration',
      description: 'Total white screen duration during page loading.',
      scoreDisplayMode: Audit.SCORING_MODES.INFORMATIVE,
      // @ts-expect-error
      requiredArtifacts: ['Screencast'],
    }
  }

  static audit(artifacts: LH.Artifacts): Promise<LH.Audit.Product> {
    // @ts-expect-error
    const screencastMetrics = artifacts.Screencast

    if (!screencastMetrics) {
      return Promise.resolve({
        notApplicable: true,
        score: null,
      })
    }

    return new Promise((resolve, reject) => {
      const videoPath = screencastMetrics.path

      let totalWhiteDuration: number | null = null

      const cmd = ffmpeg()
        .addInput(videoPath)
        .videoFilters([
          'negate',
          `blackdetect=d=${MIN_DURATION}:pix_th=${PICTURE_WHITE_RATIO_TH}:pic_th=${PIXEL_WHITE_TH}`,
        ])
        .outputOptions(['-f', 'null'])
        .addOptions(['-threads', '2'])

      cmd
        .on('start', (command) => {
          logger.verbose(`white screen detect started: ${command}`)
        })
        .on('error', (err) => {
          logger.error('error white screen detect', err)
          cmd.kill('SIGKILL')
          reject(err)
        })
        .on('end', () => {
          logger.verbose(`Finish white screen detect. total white screen duration: ${totalWhiteDuration ?? 0}`)
          if (totalWhiteDuration !== null) {
            resolve({
              numericValue: totalWhiteDuration * 1000,
              numericUnit: 'millisecond',
              score: null,
            })
          } else {
            resolve({
              notApplicable: true,
              score: null,
            })
          }
        })
        .on('stderr', (stderrLine: string) => {
          const match = stderrLine.match(
            /\[blackdetect @ [\w\d]+\] black_start:(?<whiteStart>[\d.]+) black_end:(?<whiteEnd>[\d.]+) black_duration:(?<whiteDuration>[\d.]+)/,
          )
          if (match) {
            const whiteStart = parseFloat(match.groups!.whiteStart)
            const whiteEnd = parseFloat(match.groups!.whiteEnd)
            const whiteDuration = parseFloat(match.groups!.whiteDuration)
            totalWhiteDuration = totalWhiteDuration ?? 0 + parseFloat(match.groups!.whiteDuration)
            logger.verbose(`white screen detected. from ${whiteStart}s to ${whiteEnd}s duration ${whiteDuration}s.`)
          }
        })
        .output('-')
        .run()
    })
  }
}
