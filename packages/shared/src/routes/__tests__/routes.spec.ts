import test from 'ava'

import { pathFactory } from '..'

test('pathFactory', (t) => {
  t.is(
    pathFactory.project.lab.report({
      projectId: 'test-project',
      reportId: 233,
      tabName: 'tab',
    }),
    '/projects/test-project/lab/reports/233/tab',
  )
})
