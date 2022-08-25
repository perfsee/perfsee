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

import { Mouse } from 'puppeteer-core'

import { createWrapper } from './wrapper'

// https://github.com/puppeteer/puppeteer/blob/v10.2.0/docs/api.md#class-mouse
export const mouseWrapper = createWrapper<Mouse>('Mouse', (mouse, { flow }) => {
  return {
    click: async (x, y, options) => {
      await flow.startAction('click')
      return mouse.click(x, y, options)
    },
    down: async (options) => {
      await flow.startAction('down')
      return mouse.down(options)
    },
    drag: async (start, target) => {
      await flow.startAction('drag')
      return mouse.drag(start, target)
    },
    dragAndDrop: async (start, target, options) => {
      await flow.startAction('dragAndDrop')
      return mouse.dragAndDrop(start, target, options)
    },
    dragEnter: async (target, data) => {
      await flow.startAction('dragEnter')
      return mouse.dragEnter(target, data)
    },
    dragOver: async (target, data) => {
      await flow.startAction('dragOver')
      return mouse.dragOver(target, data)
    },
    drop: async (target, data) => {
      await flow.startAction('drop')
      return mouse.drop(target, data)
    },
    move: async (x, y, options) => {
      await flow.startAction('move')
      return mouse.move(x, y, options)
    },
    up: async (options) => {
      await flow.startAction('up')
      return mouse.up(options)
    },
    wheel: async (options) => {
      await flow.startAction('wheel')
      return mouse.wheel(options)
    },
  }
})
