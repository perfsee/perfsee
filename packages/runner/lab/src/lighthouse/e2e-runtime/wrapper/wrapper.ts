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

import { WrapperOptions } from './options'

type FilterPrivateName<T> = T extends `_${any}` ? never : T
type Instance<T> = { [key in FilterPrivateName<keyof T>]: T[key] }

const globalWrappedMap = new WeakMap<any, any>()

function clearFunction(func: () => void) {
  let cleanFunction
  let functionText = func.toString()
  try {
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    cleanFunction = new Function('return (' + functionText + ')(...arguments)')
  } catch (error) {
    // This means we might have a function shorthand. Try another
    // time prefixing 'function '.
    if (functionText.startsWith('async ')) functionText = 'async function ' + functionText.substring('async '.length)
    else functionText = 'function ' + functionText
    try {
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      cleanFunction = new Function('return (' + functionText + ')(...arguments)')
    } catch (error) {
      // We tried hard to serialize, but there's a weird beast here.
      throw new Error('Passed function is not well-serializable!')
    }
  }

  return cleanFunction
}

function clearArgument(arg: any): any {
  if (
    arg === null ||
    arg === undefined ||
    typeof arg === 'number' ||
    typeof arg === 'string' ||
    typeof arg === 'boolean' ||
    typeof arg === 'bigint'
  ) {
    return arg
  }

  if (typeof arg === 'object') {
    if (globalWrappedMap.has(arg)) {
      return globalWrappedMap.get(arg)
    }

    const prototype = Reflect.getPrototypeOf(arg)

    if (prototype === Array.prototype) {
      const newArr = []
      for (const item of arg) {
        newArr.push(clearArgument(item))
      }
      return newArr
    } else if (prototype === Date.prototype) {
      return new Date(arg.getTime())
    } else if (prototype === RegExp.prototype) {
      return new RegExp(arg.source, arg.flags)
    } else if (prototype === Map.prototype) {
      return new Map(arg)
    } else if (prototype === Set.prototype) {
      return new Set(arg)
    } else if (prototype === Object.prototype) {
      const newObj = {}
      const keys = Reflect.ownKeys(arg)
      for (const key of keys) {
        const descriptor = Object.getOwnPropertyDescriptor(arg, key)
        const clearValue = clearArgument(arg[key])
        Object.defineProperty(newObj, key, {
          value: clearValue,
          enumerable: descriptor?.enumerable ?? true,
          writable: descriptor?.writable ?? true,
          configurable: descriptor?.configurable ?? true,
        })
      }
      return newObj
    }
  }

  if (typeof arg === 'function') {
    return clearFunction(arg)
  }

  throw new Error(`can't clear argument: ${arg}`)
}

function clearError(err: any) {
  return err ? new Error(err instanceof Error ? err.stack ?? err.message : err.toString()) : new Error()
}

function applyWrapper<TOriginType extends object>(
  name: string,
  origin: TOriginType,
  wrapper: UserWrapper<TOriginType>,
  options: WrapperOptions,
): TOriginType {
  const newObj = {}
  const logger = options.logger

  for (const key in wrapper) {
    let propValue = wrapper[key]

    if (typeof propValue === 'function') {
      const oldValue = propValue
      propValue = (...args: any[]) => {
        args = clearArgument(args)
        const displayName = `${name.charAt(0).toLowerCase() + name.slice(1)}.${key}(${args
          .map((a) => {
            try {
              return JSON.stringify(a)
            } catch {
              return 'unknow'
            }
          })
          .join(',')})`
        try {
          const ret = oldValue.apply(null, args)
          if (ret instanceof Promise) {
            ret
              .then(() => {
                logger.verbose(`From user scripts: ${displayName} promise resolved.`)
              })
              .catch((reason) => {
                logger.error(`From user scripts: ${displayName} promise rejected.`)
                return Promise.reject(clearError(reason))
              })
            return ret
          }
          logger.verbose(`From user scripts: ${displayName} call successful.`)
          return ret
        } catch (err) {
          logger.error(`From user scripts: ${displayName} call failed.`)
          throw clearError(err)
        }
      }
    }

    Object.defineProperty(newObj, key, {
      value: propValue,
      enumerable: {}.propertyIsEnumerable.call(origin, key),
    })
  }

  return newObj as TOriginType
}

export type Wrapper<TOriginType> = {
  wrapOrNull: (origin: TOriginType | null, options: WrapperOptions) => TOriginType | null
  wrapAll: (origin: TOriginType[], options: WrapperOptions) => TOriginType[]
  wrap: (origin: TOriginType, options: WrapperOptions) => TOriginType
  unwrap: (wrapped: TOriginType) => TOriginType
}

export type UserWrapperValue<TOriginValueType> = TOriginValueType

export type UserWrapper<TOriginType> = {
  [key in keyof Instance<TOriginType>]: UserWrapperValue<Instance<TOriginType>[key]>
}

export function createWrapper<TOriginType extends object>(
  name: string,
  wrapFn: (origin: TOriginType, options: WrapperOptions) => UserWrapper<TOriginType>,
): Wrapper<TOriginType> {
  const wrappedMap = new WeakMap<TOriginType, TOriginType>()
  const originMap = new WeakMap<TOriginType, TOriginType>()

  function wrap(origin: TOriginType, options: WrapperOptions) {
    if (originMap.has(origin)) {
      return originMap.get(origin)!
    }
    const wrapper = wrapFn(origin, options)
    const wrapped = applyWrapper(name, origin, wrapper, options)
    wrappedMap.set(wrapped, origin)
    originMap.set(origin, wrapped)
    globalWrappedMap.set(wrapped, origin)
    return wrapped
  }

  return {
    wrapOrNull: (origin, options) => {
      if (origin === null) {
        return null
      }
      return wrap(origin, options)
    },
    wrapAll: (origin, options) => {
      return origin.map((item) => wrap(item, options))
    },
    wrap,
    unwrap: (wrapped) => {
      if (wrappedMap.has(wrapped)) {
        return wrappedMap.get(wrapped)!
      }
      throw new Error('wrapper error: not a wrapped object')
    },
  }
}
