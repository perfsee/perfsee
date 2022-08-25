import { Test } from '@nestjs/testing'

import test, { createMock } from '@perfsee/platform-server/test'

import { SourceController } from '../controller'
import { SourceService } from '../service'

type AnalyzeResult = Parameters<SourceController['onReceiveAnalyzeResult']>['0']['result'] extends Array<infer R>
  ? R
  : never

test.beforeEach(async (t) => {
  t.context.module = await Test.createTestingModule({
    controllers: [SourceController],
  })
    .useMocker(createMock)
    .compile()
})

test('items have no coverage report', async (t) => {
  const service = t.context.module.get(SourceService)
  const controller = t.context.module.get(SourceController)

  const analyzeResult1 = createMock<AnalyzeResult>({
    sourceCoverageStorageKey: undefined,
    reportId: 1,
  })
  const analyzeResult2 = createMock<AnalyzeResult>({
    sourceCoverageStorageKey: undefined,
    reportId: 2,
  })

  await controller.onReceiveAnalyzeResult({
    projectId: 1,
    hash: 'commitHash',
    result: [analyzeResult1, analyzeResult2],
  })

  t.is(service.updateReportFlameChart.getCall(1).args[0], 2)
  t.true(service.saveSourceIssues.calledTwice)
  t.true(service.updateReportSourceCoverage.notCalled)
})

test('items have coverage report', async (t) => {
  const service = t.context.module.get(SourceService)
  const controller = t.context.module.get(SourceController)

  const analyzeResult = createMock<AnalyzeResult>({
    sourceCoverageStorageKey: 'StorageKey',
  })
  await controller.onReceiveAnalyzeResult({
    projectId: 1,
    hash: 'commitHash',
    result: [analyzeResult, analyzeResult],
  })

  t.true(service.updateReportFlameChart.calledTwice)
  t.true(service.saveSourceIssues.calledTwice)
  t.true(service.updateReportSourceCoverage.calledTwice)
})
