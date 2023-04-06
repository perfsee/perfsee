import { Injectable, Module, OnApplicationBootstrap } from '@nestjs/common'

import { EventEmitter, EventModule, OnEvent } from '..'

@Injectable()
class EventsProducer implements OnApplicationBootstrap {
  constructor(private readonly eventEmitter: EventEmitter) {}

  onApplicationBootstrap() {
    // @ts-expect-error
    this.eventEmitter.emit('test', 1)
  }
}

@Injectable()
export class EventsProviderConsumer {
  eventPayload = 0

  // @ts-expect-error
  @OnEvent('test')
  onTestEvent(payload: number) {
    this.eventPayload = payload
  }
}

@Module({
  imports: [EventModule],
  providers: [EventsProviderConsumer, EventsProducer],
})
export class TestEventModule {}
