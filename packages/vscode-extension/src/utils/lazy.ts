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

export default class Lazy<T> {
  private didRun = false
  private value?: T
  private error: Error | undefined

  constructor(private readonly executor: () => T) {}

  /**
   * True if the lazy value has been resolved.
   */
  hasValue() {
    return this.didRun
  }

  /**
   * Get the wrapped value.
   *
   * This will force evaluation of the lazy value if it has not been resolved yet. Lazy values are only
   * resolved once. `getValue` will re-throw exceptions that are hit while resolving the value
   */
  getValue(): T {
    if (!this.didRun) {
      try {
        this.value = this.executor()
      } catch (err) {
        this.error = err as Error
      } finally {
        this.didRun = true
      }
    }
    if (this.error) {
      throw this.error
    }
    return this.value!
  }

  /**
   * Get the wrapped value without forcing evaluation.
   */
  get rawValue(): T | undefined {
    return this.value
  }

  /**
   * Create a new lazy value that is the result of applying `f` to the wrapped value.
   *
   * This does not force the evaluation of the current lazy value.
   */
  map<R>(f: (x: T) => R): Lazy<R> {
    return new Lazy<R>(() => f(this.getValue()))
  }
}
