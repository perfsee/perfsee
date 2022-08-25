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

import { BundleAuditScore, Audit } from '../../types'

interface Candidate {
  link: string
  desc: string
}

const liteCandidates: Record<string, Candidate> = {
  moment: {
    link: 'https://day.js.org',
    desc: 'use dayjs to reduce size.',
  },
  process: {
    link: 'https://github.com/defunctzombie/node-process',
    desc: 'process is always required by webpack as polyfill when using node process api like `nextTick`. Check its issuers to find out where it was required.',
  },
}

const lodash: Candidate = {
  link: 'https://developers.google.com/web/fundamentals/performance/optimizing-javascript/tree-shaking',
  desc: 'use lodash-es for better modularization or import plugin to achieve tree-shakable bundling.',
}

export const unhealthyLibs: Audit = ({ packages, chunks }) => {
  const candidates = new Map<string, Candidate>()
  packages.forEach((pkg) => {
    if (liteCandidates[pkg.name]) {
      candidates.set(pkg.name, liteCandidates[pkg.name])
    }
  })

  if (
    chunks.some((chunk) =>
      chunk.modules.some(
        (m) =>
          (m.name === 'lodash' && /node_modules[\\/]lodash[\\/]lodash\.js/.test(m.realPath)) ||
          m.concatenating.some((m) => m.name === 'lodash' && /node_modules[\\/]lodash[\\/]index\.js/.test(m.realPath)),
      ),
    )
  ) {
    candidates.set('lodash', lodash)
  }

  return {
    id: 'unhealthy-libraries',
    title: 'Unhealthy Libraries',
    desc: 'List libraries that are not in good conditions or some may require proper adjustment to achieve best packing results.',
    detail: {
      type: 'table',
      headings: [
        { key: 'name', itemType: 'text', name: 'Name' },
        { key: 'desc', itemType: 'text', name: 'desc' },
        { key: 'link', itemType: 'link', name: '' },
      ],
      items: Array.from(candidates).map(([name, candidate]) => ({ name, ...candidate })),
    },
    score: candidates.size ? BundleAuditScore.Warn : BundleAuditScore.Good,
    numericScore: {
      value: 1 / Math.log2(candidates.size + 2),
      absoluteWarningThrottle: 0.5,
      relativeWarningThrottle: 0,
    },
    weight: 5,
  }
}
