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

import { Event, ExtractPayload } from './type'

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
  const descriptorFactory = RawOnEvent(event)
  return ((target: any, key: any, descriptor: any) => {
    const original = descriptor.value
    if (typeof original === 'function') {
      descriptor.value = function (...args: any[]) {
        const result = original.apply(this, args)

        // if is a promise
        if (result && 'catch' in result && typeof result.catch === 'function') {
          result.catch((e: any) => {
            console.error(`On event error from ${event}: ${e}`)
          })
        }
        return result
      }
    }
    return descriptorFactory(target, key, descriptor)
  }) as typeof descriptorFactory
}

@Global()
@Module({
  imports: [EventEmitterModule.forRoot()],
  providers: [eventProvider],
  exports: [EventEmitter],
})
export class EventModule {}
