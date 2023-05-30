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

import { getNetworkRecords } from '../../helpers'

export async function NetworkRequests() {
  const { Audit } = (await dynamicImport(
    'lighthouse/core/audits/audit.js',
  )) as typeof import('lighthouse/core/audits/audit')

  return class extends Audit {
    static get meta(): LH.Audit.Meta {
      return {
        id: 'network-requests',
        scoreDisplayMode: Audit.SCORING_MODES.INFORMATIVE,
        title: 'Network Requests',
        description: 'Lists the network requests that were made during page load.',
        requiredArtifacts: ['devtoolsLogs'],
      }
    }

    static async audit(artifacts: LH.Artifacts, _: LH.Audit.Context): Promise<LH.Audit.Product> {
      const devtoolsLog = artifacts.devtoolsLogs[Audit.DEFAULT_PASS]
      const results = await getNetworkRecords(devtoolsLog)

      // NOTE(i18n): this audit is only for debug info in the LHR and does not appear in the report.
      /** @type {LH.Audit.Details.Table['headings']} */
      const headings = [
        { key: 'url', itemType: 'url', text: 'URL' },
        { key: 'startTime', itemType: 'ms', granularity: 1, text: 'Start Time' },
        { key: 'endTime', itemType: 'ms', granularity: 1, text: 'End Time' },
        {
          key: 'transferSize',
          itemType: 'bytes',
          displayUnit: 'kb',
          granularity: 1,
          text: 'Transfer Size',
        },
        {
          key: 'resourceSize',
          itemType: 'bytes',
          displayUnit: 'kb',
          granularity: 1,
          text: 'Resource Size',
        },
        { key: 'statusCode', itemType: 'text', text: 'Status Code' },
        { key: 'mimeType', itemType: 'text', text: 'MIME Type' },
        { key: 'resourceType', itemType: 'text', text: 'Resource Type' },
      ]

      // @ts-expect-error
      const tableDetails = Audit.makeTableDetails(headings, results)

      return {
        score: 1,
        details: tableDetails,
      }
    }
  }
}
