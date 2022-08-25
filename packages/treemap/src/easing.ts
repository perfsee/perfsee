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

/**
 * @param t current time from 0 to 1.0
 * @param b begin value
 * @param c change to value
 */
export function easeInOutQuad(t: number, b: number, c: number) {
  if (t === 1 || b === c) {
    return c
  }
  c -= b
  t /= 1 / 2
  if (t < 1) {
    return (c / 2) * t * t + b
  }
  return (-c / 2) * (--t * (t - 2) - 1) + b
}

/**
 * @param t current time from 0 to 1.0
 * @param b begin value
 * @param c change to value
 */
export function easeInOutCubic(t: number, b: number, c: number) {
  if (t === 1 || b === c) {
    return c
  }
  c -= b
  t /= 1 / 2
  if (t < 1) {
    return (c / 2) * t * t * t + b
  }
  return (c / 2) * ((t -= 2) * t * t + 2) + b
}
