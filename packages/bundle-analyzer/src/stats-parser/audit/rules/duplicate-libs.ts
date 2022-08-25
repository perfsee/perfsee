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

import { Audit, Package, DuplicatePackage } from '../../types'
import { rangeScore } from '../utils'

const functionDuplicatePackageNames = new Map([
  ['moment', 'date'],
  ['dayjs', 'date'],
  ['date-fns', 'date'],
  ['js-joda', 'date'],
  ['lodash-es', 'lodash'],
  ['lodash', 'lodash'],
  ['echarts', 'charts'],
  ['bizcharts', 'charts'],
  ['highcharts', 'charts'],
])

export const duplicateLibs: Audit = ({ packages }) => {
  const duplicatedPackages = new Map<string, Package[]>()
  const existedPackages = new Map<string, Package>()

  packages.forEach((pkg) => {
    const pkgName = functionDuplicatePackageNames.get(pkg.name) ?? pkg.name

    // found duplicated packages
    if (existedPackages.has(pkgName)) {
      duplicatedPackages.set(pkgName, [...(duplicatedPackages.get(pkgName) ?? [existedPackages.get(pkgName)!]), pkg])
    } else {
      existedPackages.set(pkgName, pkg)
    }
  })

  return {
    id: 'duplicate-libraries',
    title: 'Deduplicate versions of libraries',
    desc: 'Different version of same library resolved by package manager.',
    link: 'https://perfsee.com/#TODO:LINK',
    detail: {
      type: 'table',
      headings: [
        { key: 'name', itemType: 'text', name: 'Name' },
        { key: 'versions', itemType: 'list', name: 'Versions' },
      ],
      items: Array.from(duplicatedPackages).map(([name, packages]) => ({
        name,
        versions: packages.map((pkg) => (pkg.version ? `${pkg.path}@${pkg.version}` : pkg.path)),
      })) as DuplicatePackage[],
    },
    score: rangeScore(duplicatedPackages.size, 0, 4),
    numericScore: {
      value: 1 / Math.log2(duplicatedPackages.size + 2),
      absoluteWarningThrottle: 0.4,
      relativeWarningThrottle: 0,
    },
    weight: 20,
  }
}
