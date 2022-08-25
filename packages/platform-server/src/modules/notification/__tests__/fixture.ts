import { Artifact } from '@perfsee/platform-server/db'
import { BundleJobStatus } from '@perfsee/server-common'
import { GitHost } from '@perfsee/shared'

import { BundleNotificationInfo } from '../type'

export const testBundleNotificationInfo = {
  artifact: {
    iid: 1,
    hash: 'abcdefghijklmn',
    createdAt: new Date(),
    status: BundleJobStatus.Passed,
    updatedAt: new Date(),
    succeeded: () => true,
    inProgress: () => false,
    failed: () => false,
  } as Artifact,
  result: {
    status: BundleJobStatus.Passed,
    entryPoints: [],
  } as any,
  project: {
    slug: 'test-project',
    name: 'test-project',
    namespace: 'test-namespace',
    host: GitHost.Github,
  } as any,
  projectSetting: {} as any,
  projectOwners: [],
} as BundleNotificationInfo
