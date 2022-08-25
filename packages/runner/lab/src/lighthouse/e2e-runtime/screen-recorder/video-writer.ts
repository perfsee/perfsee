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

import { EventEmitter } from 'events'
import os from 'os'
import { extname } from 'path'
import { PassThrough, Writable } from 'stream'

import ffmpeg, { setFfmpegPath } from 'fluent-ffmpeg'

/**
 * @ignore
 * @enum VIDEO_WRITE_STATUS
 */
export enum VIDEO_WRITE_STATUS {
  'NOT_STARTED',
  'IN_PROGRESS',
  'COMPLETED',
  'ERROR',
}

/**
 * @ignore
 * @type PageScreen
 */
export type ScreenFrame = {
  readonly blob: Buffer
  readonly timestamp: number
  readonly duration?: number
}

export type VideoWriterOptions = {
  /**
   * @name fps
   * @member VideoWriterOptions
   * @description Numeric value which denotes no.of Frames per second in which the video should be recorded. default value is 25.
   * @default 25
   */
  readonly fps?: number

  /**
   * @name ffmpeg_Path
   * @member VideoWriterOptions
   * @description String value pointing to the installation of FFMPEG. Default is null (Automatically install the FFMPEG and use it).
   * @default null
   */
  readonly ffmpeg_Path?: string | null

  /**
   * @name videoFrame
   * @member VideoWriterOptions
   * @description An object which is to specify the width and height of the capturing video frame. Default to browser viewport size.
   */
  readonly videoFrame?: {
    width: number | null
    height: number | null
  }

  /**
   * @name recordDurationLimit
   * @member VideoWriterOptions
   * @description  Numerical value specify duration (in seconds) to record the video. By default video is recorded till stop method is invoked`. (Note: It's mandatory to invoke Stop() method even if this value is set)
   */
  readonly recordDurationLimit?: number
}

/**
 * @description supported video format for recording.
 * @example
 *  recording.start('./video.mp4');
 *  recording.start('./video.mov');
 *  recording.start('./video.webm');
 *  recording.start('./video.avi');
 */
export enum SupportedFileFormats {
  MP4 = 'mp4',
  MOV = 'mov',
  AVI = 'avi',
  WEBM = 'webm',
}

/**
 * @ignore
 */
const SUPPORTED_FILE_FORMATS = [
  SupportedFileFormats.MP4,
  SupportedFileFormats.AVI,
  SupportedFileFormats.MOV,
  SupportedFileFormats.WEBM,
]

/**
 * @ignore
 * @default
 * @description This will be option passed to the puppeteer screen recorder
 */
const defaultVideoWriterOptions: Required<VideoWriterOptions> = {
  fps: 25,
  ffmpeg_Path: null,
  videoFrame: {
    width: null,
    height: null,
  },
  recordDurationLimit: -1,
}

/**
 * @ignore
 */
export default class VideoWriter extends EventEmitter {
  duration = '00:00:00:00'

  private readonly screenLimit = 40
  private screenCastFrames: ScreenFrame[] = []
  private lastProcessedFrame: ScreenFrame | undefined

  private status = VIDEO_WRITE_STATUS.NOT_STARTED
  private readonly options: Required<VideoWriterOptions> = defaultVideoWriterOptions

  private readonly videoMediatorStream: PassThrough = new PassThrough()
  private writerPromise: Promise<boolean> = null!

  constructor(destinationSource: string | Writable, options?: VideoWriterOptions) {
    super()

    if (options) {
      this.options = { ...this.options, ...options }
    }

    const isWritable = this.isWritableStream(destinationSource)
    this.configureFFmPegPath()
    if (isWritable) {
      this.configureVideoWritableStream(destinationSource as Writable)
    } else {
      this.configureVideoFile(destinationSource as string)
    }
  }

  insert(frame: ScreenFrame): void {
    // reduce the queue into half when it is full
    if (this.screenCastFrames.length === this.screenLimit) {
      const numberOfFramesToSplice = Math.floor(this.screenLimit / 2)
      const framesToProcess = this.screenCastFrames.splice(0, numberOfFramesToSplice)
      this.processFrameBeforeWrite(framesToProcess)
    }

    const insertionIndex = this.findSlot(frame.timestamp)

    if (insertionIndex === this.screenCastFrames.length) {
      this.screenCastFrames.push(frame)
    } else {
      this.screenCastFrames.splice(insertionIndex, 0, frame)
    }
  }

  write(data: Buffer, durationSeconds = 1): void {
    this.status = VIDEO_WRITE_STATUS.IN_PROGRESS

    const NUMBER_OF_FPS = Math.max(Math.floor(durationSeconds * this.options.fps), 1)

    for (let i = 0; i < NUMBER_OF_FPS; i++) {
      this.videoMediatorStream.write(data)
    }
  }

  stop(stoppedTime = Date.now() / 1000): Promise<boolean> {
    if (this.status === VIDEO_WRITE_STATUS.COMPLETED) {
      return this.writerPromise
    }

    this.drainFrames(stoppedTime)

    this.videoMediatorStream.end()
    this.status = VIDEO_WRITE_STATUS.COMPLETED
    return this.writerPromise
  }

  private get videoFrameSize(): string {
    const { width, height } = this.options.videoFrame

    return width !== null && height !== null ? `${width}x${height}` : '100%'
  }

  private getFfmpegPath(): string | null {
    if (this.options.ffmpeg_Path) {
      return this.options.ffmpeg_Path
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const ffmpeg = require('@ffmpeg-installer/ffmpeg')
      if (ffmpeg.path) {
        return ffmpeg.path
      }
      return null
    } catch (e) {
      return null
    }
  }

  private getDestinationPathExtension(destinationFile: string): SupportedFileFormats {
    const fileExtension = extname(destinationFile)
    return fileExtension.includes('.')
      ? (fileExtension.replace('.', '') as SupportedFileFormats)
      : (fileExtension as SupportedFileFormats)
  }

  private configureFFmPegPath(): void {
    const ffmpegPath = this.getFfmpegPath()

    if (!ffmpegPath) {
      throw new Error('FFmpeg path is missing, \n Set the FFMPEG_PATH env variable')
    }

    setFfmpegPath(ffmpegPath)
  }

  private isWritableStream(destinationSource: string | Writable): boolean {
    if (destinationSource && typeof destinationSource !== 'string') {
      if (
        !(destinationSource instanceof Writable) ||
        !('writable' in destinationSource) ||
        !destinationSource.writable
      ) {
        throw new Error('Output should be a writable stream')
      }
      return true
    }
    return false
  }

  private configureVideoFile(destinationPath: string): void {
    const fileExt = this.getDestinationPathExtension(destinationPath)

    if (!SUPPORTED_FILE_FORMATS.includes(fileExt)) {
      throw new Error('File format is not supported')
    }

    this.writerPromise = new Promise((resolve) => {
      const outputStream = this.getDestinationStream()

      outputStream
        .on('error', (e) => {
          this.handleWriteStreamError(e.message)
          resolve(false)
        })
        .on('end', () => resolve(true))
        .save(destinationPath)

      if (fileExt === SupportedFileFormats.WEBM) {
        outputStream.videoCodec('libvpx').videoBitrate(1000, true).outputOptions('-flags', '+global_header', '-psnr')
      }
    })
  }

  private configureVideoWritableStream(writableStream: Writable) {
    this.writerPromise = new Promise((resolve) => {
      const outputStream = this.getDestinationStream()

      outputStream
        .on('error', (e) => {
          writableStream.emit('error', e)
          resolve(false)
        })
        .on('end', () => {
          writableStream.end()
          resolve(true)
        })

      outputStream.toFormat('mp4')
      outputStream.addOutputOptions('-movflags +frag_keyframe+separate_moof+omit_tfhd_offset+empty_moov')
      outputStream.pipe(writableStream)
    })
  }

  private getDestinationStream(): ffmpeg.FfmpegCommand {
    const cpu = Math.min(1, os.cpus().length)
    const outputStream = ffmpeg({
      source: this.videoMediatorStream,
      priority: 20,
    })
      .videoCodec('libx264')
      .size(this.videoFrameSize)
      .inputFormat('image2pipe')
      .inputFPS(this.options.fps)
      .outputOptions('-preset ultrafast')
      .outputOptions('-pix_fmt yuv420p')
      .outputOptions('-minrate 1000')
      .outputOptions('-maxrate 1000')
      .outputOptions(`-threads ${cpu}`)
      .on('progress', (progressDetails) => {
        this.duration = progressDetails.timemark
      })

    if (this.options.recordDurationLimit !== -1) {
      outputStream.duration(this.options.recordDurationLimit)
    }

    return outputStream
  }

  private handleWriteStreamError(errorMessage: string): void {
    this.emit('error', errorMessage)

    if (this.status !== VIDEO_WRITE_STATUS.IN_PROGRESS && errorMessage.includes('pipe:0: End of file')) {
      return
    }
    return console.error(`Error unable to capture video stream: ${errorMessage}`)
  }

  private findSlot(timestamp: number): number {
    if (this.screenCastFrames.length === 0) {
      return 0
    }

    let i: number
    let frame: ScreenFrame

    for (i = this.screenCastFrames.length - 1; i >= 0; i--) {
      frame = this.screenCastFrames[i]

      if (timestamp > frame.timestamp) {
        break
      }
    }

    return i + 1
  }

  private trimFrame(fameList: ScreenFrame[]): ScreenFrame[] {
    if (!this.lastProcessedFrame) {
      this.lastProcessedFrame = fameList[0]
    }

    return fameList.map((currentFrame: ScreenFrame) => {
      const duration = currentFrame.timestamp - this.lastProcessedFrame!.timestamp
      this.lastProcessedFrame = currentFrame

      return {
        ...currentFrame,
        duration,
      }
    })
  }

  private processFrameBeforeWrite(frames: ScreenFrame[]): void {
    const processedFrames = this.trimFrame(frames)

    processedFrames.forEach(({ blob, duration }) => {
      this.write(blob, duration)
    })
  }

  private drainFrames(stoppedTime: number): void {
    this.processFrameBeforeWrite(this.screenCastFrames)
    this.screenCastFrames = []

    if (!this.lastProcessedFrame) return
    const durationSeconds = stoppedTime - this.lastProcessedFrame.timestamp
    this.write(this.lastProcessedFrame.blob, durationSeconds)
  }
}
