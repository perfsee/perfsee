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

import { Driver } from '../../helpers'

export class LcpElement implements LH.PerfseeGathererInstance {
  name = 'LcpElement' as const

  async beforePass() {}

  pass() {}

  async afterPass(ctx: LH.Gatherer.PassContext) {
    const driver = ctx.driver as Driver
    const traceEvents = ctx.baseArtifacts.traces['defaultPass'].traceEvents

    const lcpCandidate = traceEvents
      .filter((e) => e.name === 'largestContentfulPaint::Candidate')
      .sort((a, b) => b.args.data!['candidateIndex'] - a.args.data!['candidateIndex'])[0]
    const backendNodeId = lcpCandidate?.args.data?.nodeId

    if (!lcpCandidate || typeof backendNodeId === 'undefined') {
      return null
    }

    const { node } = await driver.sendCommand('DOM.describeNode', { backendNodeId })
    const { model: boxModel } = await driver.sendCommand('DOM.getBoxModel', { backendNodeId })
    const { outerHTML } = await driver.sendCommand('DOM.getOuterHTML', { backendNodeId })

    return {
      node,
      boxModel,
      outerHTML,
    }
  }
}
