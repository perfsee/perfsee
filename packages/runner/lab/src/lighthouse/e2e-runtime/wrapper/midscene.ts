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

import { NotSupportFunction } from './utils'
import { createWrapper } from './wrapper'

export const midsceneWrapper = createWrapper<PuppeteerAgent>('PuppeteerAgent', (mid, { flow, page }) => {
  return {
    ...mid,
    ai: async (prompt, ...args) => {
      await flow?.startAction(prompt)
      return mid.ai(prompt, ...args)
    },
    aiAction: async (prompt, ...args) => {
      await flow?.startAction(prompt)
      return mid.aiAction(prompt, ...args)
    },
    aiAssert: (...args) => mid.aiAssert(...args),
    aiQuery: (...args) => mid.aiQuery(...args),
    aiWaitFor: (...args) => mid.aiWaitFor(...args),
    appendExecutionDump: NotSupportFunction('mid.appendExecutionDump'),
    writeOutActionDumps: NotSupportFunction('mid.writeOutActionDumps'),
    getUIContext: NotSupportFunction('mid.getUIContext'),
    resetDump: NotSupportFunction('mid.resetDump'),
    dumpDataString: NotSupportFunction('mid.dumpDataString'),
    reportHTMLString: NotSupportFunction('mid.reportHtmlString'),
    destroy: NotSupportFunction('mid.destroy'),
    page: page as any,
    reportFile: mid.reportFile,
    reportFileName: mid.reportFileName,
    insight: null as any,
  }
})
