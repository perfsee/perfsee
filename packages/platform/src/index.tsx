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

import '@abraham/reflection'
import { initDevtool } from '@sigi/devtool'
import dayjs from 'dayjs'
import calendar from 'dayjs/plugin/calendar'
import duration from 'dayjs/plugin/duration'
import relativeTime from 'dayjs/plugin/relativeTime'
import { createRoot } from 'react-dom/client'

import { App } from './app'

initDevtool()

dayjs.extend(relativeTime)
dayjs.extend(calendar)
dayjs.extend(duration)

const root = createRoot(document.querySelector('#app')!)
root.render(<App />)

// @ts-expect-error
if (process.env.NODE_ENV === 'development' && module.hot) {
  // @ts-expect-error
  module.hot.accept('./app.tsx', () => {
    root.render(<App />)
  })
}
