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

import assert from 'assert'

import type { UserFlow } from 'lighthouse'

import { dynamicImport } from '@perfsee/job-runner-shared'

export type FlowResult = Omit<LH.Gatherer.GatherResult, 'runnerOptions'> & { lhr: LH.Result; stepName: string }

export class LighthouseFlow {
  readonly name: string

  private flow: UserFlow | null = null
  private isBusy = false
  private isStepStarted = false
  private isTimespanStarted = false
  private currentTimespanName = ''

  private readonly steps: Pick<FlowResult, 'stepName'>[] = []

  constructor(private readonly page: LH.Puppeteer.Page, private readonly flowOptions: UserFlow.Options) {
    this.name = 'lighthouse flow'
  }

  async startAction(name: string) {
    if (this.isStepStarted) {
      return
    }

    const { unlock } = this.busyLock()

    try {
      await this.ensureFlowStarted()

      if (this.isTimespanStarted) {
        await this.endTimespan()
      }

      await this.startTimespan(name)
    } finally {
      unlock()
    }
  }

  async startStep(name: string) {
    const { unlock } = this.busyLock()

    try {
      await this.ensureFlowStarted()

      if (this.isStepStarted) {
        throw new Error('Nested steps are not allowed.')
      }

      if (this.isTimespanStarted) {
        await this.endTimespan()
      }

      await this.startTimespan(name)

      this.isStepStarted = true
    } finally {
      unlock()
    }
  }

  async endStep() {
    const { unlock } = this.busyLock()

    try {
      await this.ensureFlowStarted()

      if (!this.isStepStarted) {
        throw new Error('Step is not started')
      }

      await this.endTimespan()

      this.isStepStarted = false
    } finally {
      unlock()
    }
  }

  async navigate(url: string) {
    const { unlock } = this.busyLock()

    try {
      await this.ensureFlowStarted()

      await this.flow!.navigate(url)
      this.steps.push({ stepName: `navigate (${url})` })
    } finally {
      unlock()
    }
  }

  async endFlow() {
    if (this.flow) {
      if (this.isTimespanStarted) {
        await this.endTimespan()
      }

      const steps: FlowResult[] = []
      const flowResult = await this.flow.createFlowResult()
      const artifacts = this.flow.createArtifactsJson()

      for (let i = 0; i < this.steps.length; i++) {
        steps.push({
          ...this.steps[i],
          lhr: flowResult.steps[i].lhr,
          artifacts: artifacts.gatherSteps[i].artifacts,
        })
      }

      return steps
    }
  }

  private async startTimespan(name: string) {
    assert(!this.isTimespanStarted, 'timespan is already started')
    await this.flow?.startTimespan({ name })
    this.isTimespanStarted = true
    this.currentTimespanName = name
  }

  private async endTimespan() {
    assert(this.isTimespanStarted, 'timespan is not started')
    await this.flow!.endTimespan()
    this.steps.push({ stepName: this.currentTimespanName })
    this.isTimespanStarted = false
  }

  private async ensureFlowStarted() {
    if (!this.flow) {
      const { startFlow } = (await dynamicImport('lighthouse')) as typeof import('lighthouse')
      this.flow = await startFlow(this.page, this.flowOptions)
    }
  }

  private busyLock() {
    assert(!this.isBusy, 'flow is busy')
    this.isBusy = true
    return {
      unlock: () => {
        this.isBusy = false
      },
    }
  }
}
