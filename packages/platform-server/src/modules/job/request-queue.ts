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

export class RequestQueue {
  private accepted = 0
  private waiting = 0
  private readonly capcity = this.limit + this.queueLimit
  constructor(private readonly limit: number, private readonly queueLimit: number, private readonly timeout: number) {}

  acquire() {
    return new Promise<void>((resolve, reject) => {
      if (this.waiting >= this.capcity) {
        reject(new Error('Too many requests'))
        return
      }
      this.waiting++

      try {
        let timeout: NodeJS.Timeout
        let interval: NodeJS.Timeout

        // if not even reaching the concurrency limit, pass through and increase acquired count
        if (this.accepted < this.limit) {
          this.accepted++
          resolve()
        } else {
          const clear = () => {
            clearTimeout(timeout)
            clearInterval(interval)
          }

          // wait until queued job released or timeout when reaching throttle
          timeout = setTimeout(() => {
            this.waiting--
            clear()
            reject(new Error('Timeout'))
          }, this.timeout)

          // check queue status
          interval = setInterval(() => {
            if (this.accepted < this.limit) {
              this.accepted++
              clear()
              resolve()
            }
          }, 100)
        }
      } catch (e) {
        this.waiting--
        throw e
      }
    })
  }

  release() {
    this.waiting--
    this.accepted--
  }

  async enqueue<T>(cb: () => Promise<T>): Promise<T> {
    await this.acquire()
    return cb().finally(() => {
      this.release()
    })
  }
}
