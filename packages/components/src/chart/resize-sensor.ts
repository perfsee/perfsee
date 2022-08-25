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

import { debounce } from 'lodash'

type Callback = () => void

export class ResizeSensor {
  private sensor: ResizeObserver | null
  private listeners: Callback[] = []
  private firstTrigger = true

  constructor(element: HTMLElement) {
    this.sensor = this.createSensor(element)
  }

  bind(listener: Callback) {
    this.listeners.push(listener)
  }

  destroy() {
    if (this.sensor) {
      this.sensor.disconnect()
      this.sensor = null
    }

    this.listeners = []
  }

  private createSensor(element: HTMLElement) {
    const s = new ResizeObserver(
      debounce(() => {
        if (this.firstTrigger) {
          this.firstTrigger = false
        } else {
          this.listeners.forEach((listener) => {
            listener()
          })
        }
      }, 60),
    )
    s.observe(element)

    return s
  }
}
