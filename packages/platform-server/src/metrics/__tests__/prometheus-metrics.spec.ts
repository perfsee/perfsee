import { Test } from '@nestjs/testing'
import test from 'ava'
import { register as globalRegistry } from 'prom-client'
import Sinon from 'sinon'

import { registerMetricsProvider } from '../providers'
import { PrometheusMetricsProvider } from '../providers/prometheus'
import { Metric } from '../service'

let service: Metric
test.before(async () => {
  const provider = registerMetricsProvider(PrometheusMetricsProvider)
  const moduleRef = await Test.createTestingModule({
    providers: [provider, Metric],
  }).compile()

  service = moduleRef.get<Metric>(Metric)
})

test.afterEach(() => {
  globalRegistry.clear()
})

test('could send counter', async (t) => {
  service.gqlRequest(1, { operationName: 'test' })
  let data = await globalRegistry.metrics()
  t.assert(data.includes('graphql:requests{operationName="test"} 1'))

  service.gqlRequest(2, { operationName: 'test2' })
  data = await globalRegistry.metrics()
  t.assert(data.includes('graphql:requests{operationName="test2"} 2'))

  t.throws(
    () => {
      service.gqlRequest(-1, { operationName: 'test' })
    },
    { instanceOf: Error, message: 'It is not possible to decrease a counter' },
  )
})

test('could send store', async (t) => {
  service.totalProject(1)
  let data = await globalRegistry.metrics()
  t.truthy(data.includes('projects:total 1'))

  service.totalProject(5)
  data = await globalRegistry.metrics()
  t.truthy(data.includes('projects:total 5'))

  service.totalProject(2)
  data = await globalRegistry.metrics()
  t.truthy(data.includes('projects:total 2'))
})

test('could send timer', async (t) => {
  const timer = Sinon.useFakeTimers()

  const endTimer1 = service.gqlRequestTime({ operationName: 'test' })
  timer.tick(2000)
  endTimer1()

  const endTimer2 = service.gqlRequestTime({ operationName: 'test' })
  timer.tick(3000)
  endTimer2()

  const data = await globalRegistry.metrics()

  // total time should be 5s
  t.assert(data.includes('graphql:requests:time_sum{operationName="test"} 5'))
  // total request count should be 2
  t.assert(data.includes('graphql:requests:time_count{operationName="test"} 2'))
})

test('could send time', async (t) => {
  service.jobPendingTime(2, { jobType: 'test' })
  service.jobPendingTime(3, { jobType: 'test' })
  service.jobPendingTime(3, { jobType: 'test' })

  const data = await globalRegistry.metrics()

  // total time should be 8s
  t.assert(data.includes('jobs:pending:time_sum{jobType="test"} 8'))
  // total request count should be 3
  t.assert(data.includes('jobs:pending:time_count{jobType="test"} 3'))
})

test('could send meter', async (t) => {
  service.visit(1, { source: 'test' })
  let data = await globalRegistry.metrics()
  t.assert(data.includes('website:visit{source="test"} 1'))

  service.visit(2, { source: 'test2' })
  data = await globalRegistry.metrics()
  t.assert(data.includes('website:visit{source="test2"} 2'))

  t.throws(
    () => {
      service.visit(-1, { source: 'test' })
    },
    { instanceOf: Error, message: 'It is not possible to decrease a counter' },
  )
})
