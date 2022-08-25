import { Profile, Environment, Page, Snapshot, SnapshotReport } from '@perfsee/platform-server/db'
import { create } from '@perfsee/platform-server/test'

export const mockCreateReport = async (projectId: number, payload?: Partial<SnapshotReport>) => {
  const page = await create(Page, { projectId })
  const profile = await create(Profile, { projectId })
  const environment = await create(Environment, { projectId })
  const snapshot = await create(Snapshot, { projectId })

  return create<SnapshotReport>(SnapshotReport, {
    profileId: profile.id,
    envId: environment.id,
    pageId: page.id,
    projectId,
    snapshotId: snapshot.id,
    ...payload,
  })
}
