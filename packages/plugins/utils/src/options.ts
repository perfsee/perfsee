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

import { merge } from 'lodash'

import { BundleResult, PerfseeReportStats } from '@perfsee/bundle-analyzer'

import { getBuildEnv } from './build-env'
import { ReportOptions } from './viewer'

export interface CommonPluginOptions {
  /**
   * Your project ID on Perfsee platform.
   *
   * **Required if you want ot upload the build to Perfsee platform for further analysis.**
   */
  project?: string

  /**
   * Your Perfsee platform url.
   */
  platform?: string

  /**
   * Give a uniq name for the bundled artifact.
   *
   * This option will be very useful when there are multiple builds in a single commit(in single CI progress)
   *
   * Because the comparison with historical builds is based on `Entrypoint`, and if multiple builds
   * emit same entrypoint names, we can't detect which entrypoint is the correct one to be compared.
   *
   * e.g. `build-1/main` and `build-2/main` are more confusing then `landing/main` and `customers/main`.
   *
   * @default 'main'
   */
  artifactName?: string | ((stats: PerfseeReportStats) => string)

  /**
   * Which toolkit used. e.g. webpack/rollup/esbuild
   *
   * @default 'webpack'
   */
  toolkit?: string

  /**
   * Enable analysis and audit right after bundle emitted.
   *
   * With this option being `true`, perfsee will output bundle analyzed result in-place in CI workflow,
   * or start a server which serves html report viewer in non-CI environment.
   *
   * It would slow down the progress if enabled.
   *
   * @environment `PERFSEE_AUDIT`
   *
   * @default false
   * @default true // "in CI environment"
   */
  enableAudit?: boolean

  /**
   * Used to customize project's own bundle auditing logic.
   *
   * Return `true` means this bundle should pass auditing, `false` to fail.
   *
   * Only used when `enableAudit` is true.
   *
   * @default (score) => score >= 80
   */
  shouldPassAudit?: (score: number, result: BundleResult) => Promise<boolean> | boolean

  /**
   * Fail the progress if bundle audit not pass and exit with non-zero code.
   *
   * set to `true` to fail the CI pipeline.
   *
   * @default false
   */
  failIfNotPass?: boolean

  /**
   * Options for output bundle report static html file.
   * Only used when `enableAudit` is true.
   */
  reportOptions?: ReportOptions

  /**
   * Authentication token used for uploading build to remote server.
   * will also read from env `PERFSEE_TOKEN` if not provided.
   *
   * @environment `PERFSEE_TOKEN`
   */
  token?: string

  /**
   * Used to modify the webpack stats file prcessed by perfsee plugin before uploading.
   *
   * Return undefined means skipping uploading.
   */
  processStats?: (stats: PerfseeReportStats) => undefined | PerfseeReportStats
}

export function getDefaultOptions(): Required<
  Pick<CommonPluginOptions, 'artifactName' | 'enableAudit' | 'token' | 'toolkit'>
> {
  return {
    artifactName: 'main',
    enableAudit: !!process.env.PERFSEE_AUDIT || getBuildEnv().isCi,
    token: process.env.PERFSEE_TOKEN!,
    toolkit: 'webpack',
  }
}

export function initOptions(userOptions: CommonPluginOptions): CommonPluginOptions {
  const defaultOptions = getDefaultOptions()

  return merge(defaultOptions, userOptions)
}
