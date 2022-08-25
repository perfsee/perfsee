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

import { Page } from 'puppeteer-core'

import VideoReader from './video-reader'
import VideoWriter, { ScreenFrame, VideoWriterOptions } from './video-writer'

export class ScreenRecorder {
  isStarted = false

  private currentVideoReader: VideoReader | null = null
  private currentPage: Page | null = null
  private videoWriter: VideoWriter = null!

  constructor(private readonly savePath: string, private readonly videoOptions?: VideoWriterOptions) {}

  record(page: Page) {
    if (this.currentPage === page) {
      return
    }

    this.currentPage = page

    if (!this.isStarted) {
      this.videoWriter = new VideoWriter(this.savePath, this.videoOptions)

      this.videoWriter.on('error', () => {
        this.stop().catch(console.error)
      })
    }

    this.isStarted = true

    this.setupPage(page)
  }

  async stop() {
    if (!this.isStarted) {
      return
    }

    this.isStarted = false

    await this.videoWriter.stop()
    await this.currentVideoReader?.stop()
  }

  private readonly handleScreenFrame = (frame: ScreenFrame) => {
    this.videoWriter.insert(frame)
  }

  private setupPage(page: Page) {
    this.currentVideoReader?.off('frame', this.handleScreenFrame)
    this.currentVideoReader?.stop().catch((err) => console.error('failed to stop video reader', err))
    this.currentVideoReader = new VideoReader(page)
    this.currentVideoReader.on('frame', this.handleScreenFrame)
    this.currentVideoReader.start().catch((err) => console.error('failed to start video reader', err))
  }
}
