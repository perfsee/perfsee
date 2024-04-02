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

import { writeFileSync } from 'fs'
import { createSandbox } from './e2e-runtime/sandbox'
import { LighthouseFlow } from './e2e-runtime/wrapper/flow'
import { puppeteerNodeWrapper } from './e2e-runtime/wrapper/puppeteer'
import { getLighthouseConfigs, getLighthouseFlags } from './lighthouse-runtime'
import { LighthouseJobWorker } from './lighthouse-worker'

export abstract class LabWithFlowJobWorker extends LighthouseJobWorker {
  protected async audit() {
    const auditResult = await super.audit()
    await this.runUserflow()
    return auditResult
  }

  private async runUserflow() {
    const browser = await this.createBrowser()
    const page = await browser.newPage()
    const lhFlags = this.getLighthouseFlags()

    const flow = new LighthouseFlow(page as any as LH.Puppeteer.Page, {
      flags: getLighthouseFlags(lhFlags),
      config: await getLighthouseConfigs(lhFlags),
    })

    const wrappedPuppeteer = puppeteerNodeWrapper.wrap({} as any, {
      page,
      browser,
      flow,
      ignoreEmulate: true,
    })
    const wrappedPage = await (await wrappedPuppeteer.launch()).newPage()

    // create sandbox
    const sandbox = createSandbox(
      {
        require: (m: string) => {
          return m === 'puppeteer' ? wrappedPuppeteer : undefined
        },
        page: wrappedPage,
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
      },
      (method, message) => this.logger.info(`[From User Flow Script] ${message} - [${method}]`),
    )

    // run
    let failedReason
    let userFlowResult
    // const startTime = Date.now()
    try {
      this.logger.info('Start run user flow script')
      await sandbox.run(this.payload.e2eScript!)
    } catch (err) {
      failedReason = 'JavaScript Error: ' + (err instanceof Error ? err.message : err)
      this.logger.error('User flow script ' + failedReason)
    }
    // const finishTime = Date.now()

    this.logger.info('User flow Script finished')

    try {
      userFlowResult = await flow.endFlow()
    } catch (err) {
      this.logger.error('Failed to end flow', { error: err })
    }

    writeFileSync(process.cwd() + '/flow.json', JSON.stringify(userFlowResult))
  }
}
