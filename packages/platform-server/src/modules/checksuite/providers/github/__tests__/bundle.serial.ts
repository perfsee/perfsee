import { Artifact } from '@perfsee/platform-server/db'
import test from '@perfsee/platform-server/test'
import { BundleJobEntryPoint, BundleJobPassedUpdate, BundleJobStatus } from '@perfsee/server-common'

import { BundleCompletedAction, CheckType } from '../../../types'
import { renderBundleOutput } from '../bundle'

test.serial('bundle comment output', (t) => {
  const exampleSizeDiff = {
    current: {
      raw: 100,
      gzip: 100,
      brotli: 100,
    },
    baseline: {
      raw: 99,
      gzip: 99,
      brotli: 99,
    },
  }
  t.snapshot(
    renderBundleOutput(
      {
        type: CheckType.Bundle,
        artifact: {
          branch: 'feat/some-new-feature',
          hash: 'bef5a36c51f59de0f3ba2e88a0c7ca968695c517',
          failed: () => false,
        } as Artifact,
        baselineArtifact: {
          branch: 'main',
          hash: 'bef5a36c51f59de0f3ba2e88a0c7ca968695c517',
        } as Artifact,
        bundleJobResult: {
          status: BundleJobStatus.Passed,
          entryPoints: {
            homepage: {
              sizeDiff: exampleSizeDiff,
              initialJsSizeDiff: exampleSizeDiff,
              initialCssSizeDiff: exampleSizeDiff,
              assetsCountDiff: {
                current: 1,
                baseline: 1,
              },
              chunksCountDiff: {
                current: 1,
                baseline: 1,
              },
              packagesCountDiff: {
                current: 1,
                baseline: 1,
              },
              duplicatedPackagesCountDiff: {
                current: 1,
                baseline: 1,
              },
              warnings: [
                {
                  rule: 'NO!!!!!',
                },
              ],
            } as BundleJobEntryPoint,
          } as Record<string, BundleJobEntryPoint>,
        } as BundleJobPassedUpdate,
      } as BundleCompletedAction,
      'https://perfsee.com/projects/perfsee/bundle/1',
    ),
  )
})
