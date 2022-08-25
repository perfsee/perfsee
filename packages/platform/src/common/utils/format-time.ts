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

const unit = ['ms', 'sec', 'min'] as const

export const formatTime = (time: number): { value: string; unit: 'ms' | 'sec' | 'min' } => {
  let unitIndex = 0
  if (time > 1000) {
    time /= 1000
    unitIndex += 1
    if (time > 60) {
      time /= 60
      unitIndex += 1
    }
  }
  return { value: Number.isInteger(time) ? time.toString() : time.toFixed(2), unit: unit[unitIndex] }
}
