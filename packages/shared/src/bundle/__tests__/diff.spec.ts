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

import { readFileSync } from 'fs'
import { resolve } from 'path'

import test from 'ava'

import { BundleResult } from '../../types'
import { analysisPackages, diffBundleResult, formatPackageIssueMap } from '../diff'

test('diff bundle result', (t) => {
  const file = readFileSync(resolve(__dirname, '.', 'fixtures', 'report.json'), 'utf-8')
  const report = JSON.parse(file) as BundleResult
  const result = diffBundleResult(report, report)

  t.snapshot(result, 'diff bundle')
})

test('format package issue map', (t) => {
  const file = readFileSync(resolve(__dirname, '.', 'fixtures', 'report.json'), 'utf-8')
  const report = JSON.parse(file) as BundleResult
  const result = formatPackageIssueMap(report)

  t.snapshot(result, 'format package issue map')
})

test('analysis packages', (t) => {
  const file = readFileSync(resolve(__dirname, '.', 'fixtures', 'report.json'), 'utf-8')
  const report = JSON.parse(file) as BundleResult
  const result = analysisPackages(report)

  t.snapshot(result, 'analysis packages')
})
