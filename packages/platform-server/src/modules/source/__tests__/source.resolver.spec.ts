import { Test } from '@nestjs/testing'

import { Project, SourceIssue } from '@perfsee/platform-server/db'
import test, { createMock, defaultPagination } from '@perfsee/platform-server/test'

import { ProjectSourceIssueResolver } from '../resolver'
import { SourceService } from '../service'

test.beforeEach(async (t) => {
  t.context.module = await Test.createTestingModule({
    controllers: [ProjectSourceIssueResolver],
  })
    .useMocker(createMock)
    .compile()
})

test('resolve source issues', async (t) => {
  const service = t.context.module.get(SourceService)
  const resolver = t.context.module.get(ProjectSourceIssueResolver)

  const parentProject = createMock<Project>()
  const issues = [
    createMock<SourceIssue>({
      hash: 'hash123',
    }),
    createMock<SourceIssue>({
      frameKey: 'framekey123',
    }),
  ]

  service.getSourceIssues.resolves([issues, 2])

  const pagedIssues = await resolver.sourceIssues(parentProject, defaultPagination, 'hash')

  t.like(pagedIssues.pageInfo, { totalCount: 2, hasNextPage: false })
  t.is(pagedIssues.edges[0].node.hash, 'hash123')
  t.is(pagedIssues.edges[1].node.frameKey, 'framekey123')
})
