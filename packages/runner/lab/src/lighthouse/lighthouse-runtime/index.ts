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

import { dynamicImport } from '@perfsee/job-runner-shared'

import { CauseForLCP, NetworkRequests, WhiteScreen } from './audits'
import { ConsoleLogger, ReactProfiler, RequestInterception, Screencast } from './gatherers'
import { LcpElement } from './gatherers/lcp-element'

export async function getLighthouseConfigs({ customFlags }: LH.Flags = {}): Promise<LH.Config> {
  const { default: defaultConfig } = (await dynamicImport(
    'lighthouse/core/config/default-config.js',
  )) as typeof import('lighthouse/core/config/default-config')

  defaultConfig.categories!['performance'].auditRefs.push(
    { id: 'network-requests-custom', weight: 0, group: 'hidden' },
    { id: 'white-screen', weight: 0, group: 'hidden' },
    { id: 'cause-for-lcp', weight: 0, group: 'hidden' },
  )
  return {
    ...defaultConfig,
    // @ts-expect-error
    artifacts: customFlags?.dryRun
      ? [
          { id: 'DevtoolsLog', gatherer: 'devtools-log' },
          { id: 'RequestInterception', gatherer: new RequestInterception(customFlags?.headers) },
          { id: 'ConsoleLogger', gatherer: ConsoleLogger },
        ]
      : [
          ...(defaultConfig.artifacts ?? []),
          { id: 'RequestInterception', gatherer: new RequestInterception(customFlags?.headers) },
          { id: 'ConsoleLogger', gatherer: ConsoleLogger },
          { id: 'Screencast', gatherer: Screencast },
          { id: 'LcpElement', gatherer: await LcpElement() },
          ...(customFlags?.reactProfiling ? [{ id: 'ReactProfiler', gatherer: ReactProfiler }] : []),
        ],
    audits: customFlags?.dryRun
      ? [await NetworkRequests()]
      : [...(defaultConfig.audits ?? []), await NetworkRequests(), await WhiteScreen(), await CauseForLCP()],
    settings: {
      additionalTraceCategories: 'disabled-by-default-v8.cpu_profiler',
    },
    categories: customFlags?.dryRun ? {} : defaultConfig.categories,
  }
}

export function getLighthouseFlags({ customFlags, ...flags }: LH.Flags = {}) {
  return {
    maxWaitForFcp: 30 * 1000,
    maxWaitForLoad: 45 * 1000,
    output: 'json' as const,
    logLevel: 'info' as const,
    skipAudits: ['bf-cache'], // not working in headless mode
    ignoreStatusCode: true,
    disableStorageReset: !!customFlags?.withCache,
    ...flags,
  }
}

export async function lighthouse(url?: string, flags: LH.Flags = {}) {
  const { default: run } = (await dynamicImport('lighthouse')) as typeof import('lighthouse')

  return run(url, getLighthouseFlags(flags), await getLighthouseConfigs(flags))
}
