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

import { Touchscreen } from 'puppeteer-core'

import { createWrapper } from './wrapper'

// https://github.com/puppeteer/puppeteer/blob/v11.0.0/docs/api.md#class-touchscreen
export const touchscreenWrapper = createWrapper<Touchscreen>('Touchscreen', (touchscreen, { flow }) => {
  return {
    tap: async (x, y) => {
      await flow?.startAction(`tap screen \`${x},${y}\``)
      return touchscreen.tap(x, y)
    },
    touchStart: async (x, y) => {
      await flow?.startAction(`touch screen start \`${x},${y}\``)
      return touchscreen.touchStart(x, y)
    },
    touchEnd: async () => {
      await flow?.startAction('touch screen end')
      return touchscreen.touchEnd()
    },
    touchMove: async (x, y) => {
      await flow?.startAction(`touch screen move \`${x},${y}\``)
      return touchscreen.touchMove(x, y)
    },
  }
})
