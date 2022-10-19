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
