import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'

import test from '@perfsee/platform-server/test'

import { EventsProviderConsumer, TestEventModule } from './test.module'

let app: INestApplication

test.beforeEach(async () => {
  const module = await Test.createTestingModule({
    imports: [TestEventModule],
  }).compile()
  app = module.createNestApplication()
})

test('should call handler when event is emitted', async (t) => {
  const eventsConsumerRef = app.get(EventsProviderConsumer)
  await app.init()

  t.is(eventsConsumerRef.eventPayload, 1)
})
