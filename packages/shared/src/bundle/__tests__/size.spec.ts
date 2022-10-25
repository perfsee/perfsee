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

import test from 'ava'

import { Size } from '../../types'
import { addSize, getDefaultSize } from '../size'

test('get default size', (t) => {
  const size = getDefaultSize()

  t.like(size, { raw: 0, gzip: 0, brotli: 0 })
})

test('add size', (t) => {
  const sizeA: Size = {
    raw: 1,
    gzip: 1,
    brotli: 1,
  }

  const sizeB: Size = {
    raw: 2,
    gzip: 3,
    brotli: 4,
  }

  const result = addSize(sizeA, sizeB)

  t.is(result.raw, 3)
  t.is(result.gzip, 4)
  t.is(result.brotli, 5)
})
