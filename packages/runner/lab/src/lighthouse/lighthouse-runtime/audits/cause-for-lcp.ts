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

import type { TraceEvent } from 'lighthouse'

import { dynamicImport } from '@perfsee/job-runner-shared'
import { FunctionStackTrace } from '@perfsee/shared'

import { getNetworkRecords } from '../../helpers'
import * as SamplesHandler from '../../helpers/samples-handler'

type Networks = ReturnType<typeof getNetworkRecords> extends Promise<infer N> ? N : never

const getcriticalPathForLcp = (traceEvents: TraceEvent[], lcpEvent: TraceEvent, networks: Networks) => {
  switch (lcpEvent.args.data?.type) {
    case 'image':
      const lmp = traceEvents.find((e) => {
        return (
          e.name === 'LargestImagePaint::Candidate' && e.args.data?.['DOMNodeId'] === lcpEvent.args.data?.['nodeId']
        )
      })
      const imageUrl = lmp?.args.data?.['imageUrl']
      const imageFrame = lmp?.args.frame

      const requestSendTraceEvent = traceEvents.find((e) => {
        return (
          e.pid === lcpEvent.pid &&
          e.tid === lcpEvent.tid &&
          e.args.data?.frame === imageFrame &&
          e.name === 'ResourceSendRequest' &&
          e.args.data?.url === imageUrl
        )
      })

      const request = networks.find((net) => net.requestId === requestSendTraceEvent?.args.data?.requestId)

      if (!request) {
        return null
      }

      return {
        request,
        domEvent: lmp,
        url: imageUrl,
      }
    case 'text': {
      const ltp = traceEvents.find((e) => {
        return e.name === 'LargestTextPaint::Candidate' && e.args.data?.['DOMNodeId'] === lcpEvent.args.data?.['nodeId']
      })
      return {
        domEvent: ltp,
      }
    }
    default:
      return null
  }
}

const buildSamplesFromTraceEvents = (traceEvents: TraceEvent[]) => {
  SamplesHandler.reset()
  SamplesHandler.initialize()
  traceEvents.forEach((e) => {
    SamplesHandler.handleEvent(e)
  })

  SamplesHandler.finalize()
}

function buildHotFunctionsStackTracesForLongTask(task: TraceEvent) {
  const { processes } = SamplesHandler.data()
  const thread = processes.get(task.pid)?.threads.get(task.tid)
  // This threshold is temporarily set to 0 until so that at the moment
  // we want to always show what functions were executed in a long task.
  // In the future however, as we provide more sophisticated details
  // for long tasks, we should set the threshold to a more valuable value.
  const HOT_FUNCTION_MIN_SELF_PERCENTAGE = 0
  const calls = thread?.calls
  const taskStart = task.ts
  const taskEnd = task.ts + (task.dur || 0)
  const hotFunctions =
    calls &&
    SamplesHandler.getAllHotFunctionsBetweenTimestamps(calls, taskStart, taskEnd, HOT_FUNCTION_MIN_SELF_PERCENTAGE)
  const tree = thread?.tree
  if (!hotFunctions || !tree) {
    return
  }
  // Store the top 10 hot functions.
  const MAX_HOT_FUNCTION_COUNT = 10

  // @ts-expect-error
  task.hotFunctionsStackTraces = hotFunctions
    .slice(0, MAX_HOT_FUNCTION_COUNT)
    .map((hotFunction: any) =>
      SamplesHandler.buildStackTraceAsCallFramesFromId(tree, hotFunction.stackFrame.nodeId).reverse(),
    )
}

export async function CauseForLCP() {
  const { Audit } = (await dynamicImport(
    'lighthouse/core/audits/audit.js',
  )) as typeof import('lighthouse/core/audits/audit')

  return class extends Audit {
    static get meta(): LH.Audit.Meta {
      return {
        id: 'cause-for-lcp',
        scoreDisplayMode: Audit.SCORING_MODES.INFORMATIVE,
        title: 'Cause for LCP',
        failureTitle: '',
        description: 'Cause for lcp.',
        // @ts-expect-error
        requiredArtifacts: ['Trace', 'LcpElement', 'DevtoolsLog'],
      }
    }

    static async audit(artifacts: LH.Artifacts, _: LH.Audit.Context): Promise<LH.Audit.Product> {
      const traceEvents = artifacts.Trace.traceEvents
      const networks = await getNetworkRecords(artifacts.DevtoolsLog)
      const LcpElement = artifacts['LcpElement']

      const lcpCandidate = traceEvents
        .filter((e) => e.name === 'largestContentfulPaint::Candidate')
        .sort((a, b) => b.args.data!['candidateIndex'] - a.args.data!['candidateIndex'])[0]
      const navigationStart = traceEvents.find((e) => e.cat === 'blink.user_timing' && e.name === 'navigationStart')

      if (!lcpCandidate || !navigationStart) {
        return Promise.resolve({
          score: null,
          notApplicable: true,
        })
      }

      const {
        ts: lcpTs,
        args: { frame: lcpFrame },
      } = lcpCandidate
      const navigationStartTs = navigationStart.ts

      buildSamplesFromTraceEvents(traceEvents)
      const longtasks = traceEvents.filter((e) => {
        return (
          e.name === 'RunTask' &&
          e.dur >= 50000 &&
          e.pid === lcpCandidate.pid &&
          e.tid === lcpCandidate.tid &&
          e.ts >= navigationStartTs &&
          (e.ts + e.dur || 0) <= lcpTs
        )
      })
      longtasks.forEach(buildHotFunctionsStackTracesForLongTask)

      const networkBlockings = traceEvents.filter((e) => {
        const renderBlocking = e.args.data?.['renderBlocking']
        return (
          renderBlocking &&
          renderBlocking !== 'non_blocking' &&
          e.args.data?.frame === lcpFrame &&
          e.ts >= navigationStartTs &&
          e.ts + (e.dur ?? 0) <= lcpTs
        )
      })

      const criticalPathForLcp = getcriticalPathForLcp(traceEvents, lcpCandidate, networks)

      const documentLoaderURL = navigationStart.args.data?.documentLoaderURL

      const resourceLoadTime = criticalPathForLcp?.request?.timing ?? 0

      const navigationResponseRecevied = networks.find(
        (net) => net.url === documentLoaderURL && net.requestId === navigationStart.args.data?.['navigationId'],
      )

      const navigationTimeToFirstByte =
        (navigationResponseRecevied?.startTime ?? 0) +
        ((navigationResponseRecevied?.timing ?? 0) -
          (navigationResponseRecevied?.timings.find((timing) => timing.name === 'Receive')?.value ?? 0))

      const resourceLoadDelay = (criticalPathForLcp?.request?.startTime ?? 0) - navigationTimeToFirstByte

      const headings: LH.Audit.Details.Table['headings'] = []

      return Promise.resolve({
        score: null,
        details: Audit.makeTableDetails(headings, [
          {
            // @ts-expect-error
            longtasks: longtasks.filter((longtask) => {
              // @ts-expect-error
              const hotFunctionStackTraces = longtask.hotFunctionsStackTraces as FunctionStackTrace[][] | undefined
              for (const stacks of hotFunctionStackTraces ?? []) {
                for (const stack of stacks ?? []) {
                  if (stack.functionName === '__puppeteer_evaluation_script__') {
                    return false
                  }
                }
              }
              return true
            }),
            // @ts-expect-error
            criticalPathForLcp,
            LcpElement,
            // @ts-expect-error
            networkBlockings,
            // @ts-expect-error
            lcpCandidate,
            // @ts-expect-error
            metrics: {
              navigationTimeToFirstByte,
              resourceLoadDelay,
              resourceLoadTime,
            },
          },
        ]),
      })
    }
  }
}
