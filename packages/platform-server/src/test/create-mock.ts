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

import sinon from 'sinon'

export declare type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T[P] extends ReadonlyArray<infer U>
    ? ReadonlyArray<DeepPartial<U>>
    : DeepPartial<T[P]> | T[P]
}

export type PartialFuncReturn<T> = {
  [K in keyof T]?: T[K] extends (...args: infer A) => infer U ? (...args: A) => PartialFuncReturn<U> : DeepPartial<T[K]>
}

export type DeepMocked<T> = {
  [K in keyof T]: Required<T>[K] extends (...args: infer TArgs) => infer TReturn
    ? sinon.SinonStub<TArgs, TReturn> & ((...args: TArgs) => DeepMocked<TReturn>)
    : Required<T>[K] extends (a: infer Arg1, ...args: infer TArgs) => infer TReturn
    ? sinon.SinonStub<[Arg1, ...TArgs], TReturn> & ((a: Arg1, ...args: TArgs) => DeepMocked<TReturn>)
    : T[K]
} & T

const createRecursiveMockProxy = (_name: string): any => {
  const cache = new Map<string | number | symbol, any>()

  const proxy = new Proxy(
    {},
    {
      get: (obj, prop) => {
        const propName = prop.toString()
        if (cache.has(prop)) {
          return cache.get(prop)
        }

        const checkProp = obj[prop]

        const mockedProp =
          prop in obj
            ? typeof checkProp === 'function'
              ? sinon.stub()
              : checkProp
            : propName === 'then'
            ? undefined
            : createRecursiveMockProxy(propName)

        cache.set(prop, mockedProp)

        return mockedProp
      },
    },
  )

  return sinon.stub().returns(proxy)
}

export type MockOptions = {
  name?: string
}

export const createMock = <T extends object>(
  partial: PartialFuncReturn<T> = {},
  options: MockOptions = {},
): DeepMocked<T> => {
  const cache = new Map<string | number | symbol, any>()
  const { name = 'mock' } = options

  const proxy = new Proxy(typeof partial === 'object' ? partial : ({} as typeof partial), {
    get: (obj, prop) => {
      if (prop === 'constructor') {
        // return `undefined` will cause nestjs di system going wrong
        return partial
      }

      if (
        prop === 'inspect' ||
        prop === 'then' ||
        (typeof prop === 'symbol' && prop.toString() === 'Symbol(util.inspect.custom)')
      ) {
        return undefined
      }

      if (cache.has(prop)) {
        return cache.get(prop)
      }

      const checkProp = obj[prop]

      const mockedProp =
        prop in obj
          ? typeof checkProp === 'function'
            ? sinon.stub(obj, prop as keyof T)
            : checkProp
          : createRecursiveMockProxy(`${name}.${prop.toString()}`)

      cache.set(prop, mockedProp)
      return mockedProp
    },
  })

  return proxy as DeepMocked<T>
}
