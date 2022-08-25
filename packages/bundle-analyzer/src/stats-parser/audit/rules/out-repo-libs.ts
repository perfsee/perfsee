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

import { SOURCE_CODE_PATH, WEBPACK_INTERNAL_PATH } from '../../../stats'
import { Audit, BundleAuditScore } from '../../types'

export const outRepoLibs: Audit = ({ packages, stats }) => {
  // old versions of webpack plugin didn't collect versions information
  if (!stats.packageVersions?.length) {
    return []
  }

  const outRepoLibs = new Set<string>()

  packages.forEach((pkg) => {
    if (!pkg.version && !pkg.ignored && pkg.path !== SOURCE_CODE_PATH && pkg.path !== WEBPACK_INTERNAL_PATH) {
      outRepoLibs.add(pkg.path)
    }
  })

  return {
    id: 'uncontrolled-libraries',
    title: 'Uncontrolled libraries used in bundle result',
    desc: `Some packing tools may resolve dependencies to the versions that are not specified in project's package.json,
which will cause those dependencies' versions can't be controlled by npm or yarn.
In other words, they may cause duplicate versions of same packages bundled or, even worse, cause critical compatibility bugs.`,
    detail: {
      type: 'list',
      items: Array.from(outRepoLibs).slice(0, 10),
    },
    score: outRepoLibs.size ? BundleAuditScore.Bad : BundleAuditScore.Good,
    numericScore: {
      value: outRepoLibs.size ? 0 : 1,
      absoluteWarningThrottle: 1,
    },
    weight: 0,
  }
}
