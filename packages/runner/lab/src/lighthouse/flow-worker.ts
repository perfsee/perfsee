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

import { PuppeteerAgent } from '@midscene/web/puppeteer'

import { TimelineSchema } from '@perfsee/shared'

import { createSandbox } from './e2e-runtime/sandbox'
import { FlowResult, LighthouseFlow } from './e2e-runtime/wrapper/flow'
import { midsceneWrapper } from './e2e-runtime/wrapper/midscene'
import { puppeteerNodeWrapper } from './e2e-runtime/wrapper/puppeteer'
import { getLighthouseMetricScores } from './helpers'
import { getLighthouseConfigs, getLighthouseFlags } from './lighthouse-runtime'
import { LighthouseJobWorker } from './lighthouse-worker'

export abstract class LabWithFlowJobWorker extends LighthouseJobWorker {
  protected async audit() {
    await this.wrapLighthouseLogger()
    const lhResult = await this.runLighthouse()

    return this.collectResults(lhResult)
  }

  protected async runLh() {
    const browser = await this.createBrowser()
    const page = await browser.newPage()
    const lhFlags = this.getLighthouseFlags()

    const flow = new LighthouseFlow(page as any as LH.Puppeteer.Page, {
      flags: getLighthouseFlags(lhFlags),
      config: await getLighthouseConfigs(lhFlags),
    })

    const wrapperOptions = {
      page,
      browser,
      flow,
      ignoreEmulate: true,
      ignoreErrorOnWaitNavigation: true,
      ignoreErrorOnWaitNetworkIdle: true,
      logger: this.logger,
    }
    const wrappedPuppeteer = puppeteerNodeWrapper.wrap({} as any, wrapperOptions)
    const wrappedPage = await (await wrappedPuppeteer.launch()).newPage()
    const mid = midsceneWrapper.wrap(new PuppeteerAgent(page, { cacheId: this.getCacheId() }), wrapperOptions)
    // create sandbox
    const sandbox = createSandbox(
      {
        require: (m: string) => {
          return m === 'puppeteer' ? wrappedPuppeteer : undefined
        },
        page: wrappedPage,
        puppeteer: wrappedPuppeteer,
        flow: {
          startStep: (name: string) => {
            if (typeof name !== 'string' || name.trim() === '') {
              throw new Error(`Invalid step name: ${name}`)
            }
            return flow.startStep(name)
          },
          endStep: () => {
            return flow.endStep()
          },
        },
        mid,
        ai: mid.ai,
        aiQuery: mid.aiQuery,
        aiWaitFor: mid.aiWaitFor,
        aiAction: mid.aiAction,
        aiAssert: mid.aiAssert,
      },
      (method, message) => this.logger.info(`[From User Flow Script] ${message} - [${method}]`),
    )

    await wrappedPage.goto(this.payload.url)

    // run
    let failedReason
    let userFlowResult: FlowResult[] | undefined
    try {
      this.logger.info('Start run user flow script')
      await sandbox.run(this.payload.e2eScript!)
    } catch (err) {
      failedReason = 'JavaScript Error: ' + (err instanceof Error ? err.message : err)
      this.logger.error('User flow script ' + failedReason)
      await this.recordScreenshot(wrappedPage)
    }

    try {
      await page.waitForNetworkIdle({ timeout: 5 * 1000 })
    } catch {
      //
    }

    this.logger.info('User flow Script finished')

    try {
      userFlowResult = await flow.endFlow()
    } catch (err) {
      this.logger.error('Failed to end flow', { error: err })
    }

    if (!userFlowResult?.length) {
      return {
        result: undefined,
        errorMessage: failedReason,
      }
    }

    try {
      await browser.close()
      this.logger.verbose('Browser closed')
    } catch (e) {
      this.logger.error('Failed to close browser', { error: e })
    }

    return {
      result: {
        report: [],
        artifacts: userFlowResult[0].artifacts,
        lhr: userFlowResult[0].lhr,
        userFlowResult,
      },
      errorMessage: failedReason,
    }
  }

  protected shouldHaveLcp(): boolean {
    return false
  }

  protected async collectResults(lhResult: LH.PerfseeRunnerResult & { userFlowResult?: FlowResult[] }) {
    const userFlowResult = lhResult.userFlowResult

    const flowResults = userFlowResult?.map(({ lhr, stepName, artifacts }, i) => {
      // format overview render timeline data
      // @ts-expect-error
      const timelines = (lhr.audits['screenshot-thumbnails'].details?.items ?? []) as TimelineSchema[]
      const metricScores = getLighthouseMetricScores(lhr.gatherMode, lhr.audits, artifacts)

      return {
        stepName,
        timelines,
        metricScores,
        stepId: i,
      }
    })

    const results = []

    for (const [index, r] of (userFlowResult ?? []).entries()) {
      const result = await super.collectResults(r, index === 0 ? flowResults : undefined)
      results.push({
        ...result,
        stepName: r.stepName,
        stepId: index,
      })
    }

    const [first, ...rest] = results

    if (!first) {
      throw new Error('no valid user flow step result')
    }

    return {
      ...first,
      steps: rest,
    }
  }

  protected hasRedirection() {
    return false
  }
}
