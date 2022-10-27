/*
Copyright 2022 ByteDance and/or its affiliates.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import { Global, Module, Provider } from '@nestjs/common'
import { EventEmitter2, EventEmitterModule, OnEvent as RawOnEvent } from '@nestjs/event-emitter'

import { JobType, CreateJobEvent } from '@perfsee/server-common'

type KnownEvent = 'job.create' | 'job.register_payload_getter' | 'maintenance.enter' | 'maintenance.leave'
type DynamicEvent = JobType | `${JobType}.update` | `${JobType}.error`
export type Event = DynamicEvent | KnownEvent

type EventPayload =
  | {
      type: 'job.create'
      payload: [CreateJobEvent | CreateJobEvent[]]
    }
  | {
      type: 'job.register_payload_getter'
      payload: [JobType, (entityId: number, extra: { key: string }) => Promise<any>]
    }
  | {
      type: `${JobType}.error`
      payload: [number, string]
    }

type ExtractPayload<T extends Event> = Extract<EventPayload, { type: T }>['payload'] extends never
  ? any[]
  : Extract<EventPayload, { type: T }>['payload']

// we use this class to override the signature emit and emitAsync functions,
// so we got typechecking for the events we use.
// not actually used in the code
export class EventEmitter extends EventEmitter2 {
  emit<E extends Event>(event: E, ...values: ExtractPayload<E>): boolean {
    return super.emit(event, ...values)
  }

  emitAsync<E extends Event>(event: E, ...values: ExtractPayload<E>): Promise<any[]> {
    return super.emitAsync(event, ...values)
  }
}

// everywhere `EventEmitter` is injected,
// the actual got instance is the real `EventEmitter2` instance
const eventProvider: Provider = {
  provide: EventEmitter,
  useFactory: (realEmitter: EventEmitter2) => realEmitter,
  inject: [EventEmitter2],
}

export const OnEvent = (event: Event) => {
  return RawOnEvent(event)
}

@Global()
@Module({
  imports: [EventEmitterModule.forRoot()],
  providers: [eventProvider],
  exports: [EventEmitter],
})
export class EventModule {}
