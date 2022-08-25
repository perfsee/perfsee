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

import dayJs from 'dayjs'

export function formatMsDuration(ms: number, withSuffix?: boolean, digits?: number) {
  const duration = dayJs.duration(ms)

  if (withSuffix) {
    if (ms < 2000) {
      return (digits ? ms.toFixed(digits) : Math.floor(ms)) + 'ms'
    }
    const duration = dayJs.duration(ms)
    const separate = ['d', 'h', 'm', 's']
    return [Math.floor(duration.asDays()), duration.hours(), duration.minutes(), duration.seconds()].reduce(
      (prev, curr, i, arr) => {
        if (!arr[i]) {
          return prev + ''
        }
        return prev + curr + separate[i]
      },
      '',
    )
  }

  return [Math.floor(duration.asDays() * 24) + duration.hours(), duration.minutes(), duration.seconds()]
    .map((part) => String(part).padStart(2, '0'))
    .join(':')
}
