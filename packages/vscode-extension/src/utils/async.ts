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

import { CancellationToken, CancellationTokenSource, Event, Disposable } from 'vscode'

export class CanceledError extends Error {
  constructor() {
    super()
    this.name = 'Canceled'
  }
}

export interface CancelablePromise<T> extends Promise<T> {
  cancel: () => void
}

export function createCancelablePromise<T>(
  callback: (token: CancellationToken) => Thenable<T>,
  source: CancellationTokenSource = new CancellationTokenSource(),
): CancelablePromise<T> {
  const thenable = callback(source.token)
  const promise = new Promise<T>((resolve, reject) => {
    source.token.onCancellationRequested(() => {
      reject(new CanceledError())
    })
    Promise.resolve(thenable).then(
      (value) => {
        source.dispose()
        resolve(value)
      },
      (err) => {
        source.dispose()
        reject(err)
      },
    )
  })

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return <CancelablePromise<T>>new (class {
    cancel() {
      source.cancel()
    }
    then<
      TResult1 = T,
      TResult2 = never,
    >(resolve?: ((value: T) => TResult1 | Promise<TResult1>) | undefined | null, reject?: ((reason: any) => TResult2 | Promise<TResult2>) | undefined | null): Promise<TResult1 | TResult2> {
      return promise.then(resolve, reject)
    }
    catch<
      TResult = never,
    >(reject?: ((reason: any) => TResult | Promise<TResult>) | undefined | null): Promise<T | TResult> {
      return this.then(undefined, reject)
    }
    finally(onfinally?: (() => void) | undefined | null): Promise<T> {
      return promise.finally(onfinally)
    }
  })()
}

export function raceCancellation<T>(promise: Promise<T>, token: CancellationToken): Promise<T | undefined>
export function raceCancellation<T>(promise: Promise<T>, token: CancellationToken, defaultValue: T): Promise<T>
export function raceCancellation<T>(
  promise: Promise<T>,
  token: CancellationToken,
  defaultValue?: T,
): Promise<T | undefined> {
  return Promise.race([
    promise,
    new Promise<T | undefined>((resolve) => token.onCancellationRequested(() => resolve(defaultValue))),
  ])
}

export interface PromiseAdapter<T, U> {
  (value: T, resolve: (value: U | PromiseLike<U>) => void, reject: (reason: any) => void): any
}

const passthrough = (value: any, resolve: (value?: any) => void) => resolve(value)

/**
 * Return a promise that resolves with the next emitted event, or with some future
 * event as decided by an adapter.
 *
 * If specified, the adapter is a function that will be called with
 * `(event, resolve, reject)`. It will be called once per event until it resolves or
 * rejects.
 *
 * The default adapter is the passthrough function `(value, resolve) => resolve(value)`.
 *
 * @param event the event
 * @param adapter controls resolution of the returned promise
 * @returns a promise that resolves or rejects as specified by the adapter
 */
export function promiseFromEvent<T, U>(
  event: Event<T>,
  adapter: PromiseAdapter<T, U> = passthrough,
  cancellationToken?: CancellationToken,
): Promise<U> {
  let subscription: Disposable
  return new Promise<U>((resolve, reject) => {
    if (cancellationToken?.isCancellationRequested) reject(new CanceledError())
    cancellationToken?.onCancellationRequested((_) => reject(new CanceledError()))
    subscription = event((value: T) => {
      try {
        Promise.resolve(adapter(value, resolve, reject)).catch(reject)
      } catch (error) {
        reject(error)
      }
    })
  }).then(
    (result: U) => {
      subscription.dispose()
      return result
    },
    (error) => {
      subscription.dispose()
      throw error
    },
  )
}

export class Deferred<T> {
  resolve: (value: T | PromiseLike<T>) => void = null!
  reject: (reason?: any) => void = null!
  promise: Promise<T>
  constructor() {
    this.promise = new Promise<T>((resolve, reject) => {
      this.resolve = resolve
      this.reject = reject
    })
  }

  then: Deferred<T>['promise']['then'] = (cb) => {
    return this.promise.then(cb)
  }

  catch: Deferred<T>['promise']['catch'] = (cb) => {
    return this.promise.catch(cb)
  }
}
