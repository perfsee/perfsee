import { SourceIssue } from '@perfsee/platform-server/db'
import test, { createMock, initTestDB, createDBTestingModule, create } from '@perfsee/platform-server/test'

import { SourceService } from '../service'

test.beforeEach(async (t) => {
  t.context.module = await createDBTestingModule({
    providers: [SourceService],
  })
    .useMocker(createMock)
    .compile()

  await initTestDB()
})

test.serial('get issue by id', async (t) => {
  const savedIssue = await create(SourceIssue, {
    iid: 1,
    projectId: 1,
    snapshotReportId: 1,
  })

  const service = t.context.module.get(SourceService)
  const issue = await service.getIssueByIid(1, 1)

  t.truthy(issue)
  t.assert(savedIssue.id === issue!.id)
  t.assert(savedIssue.hash === issue!.hash)
})
