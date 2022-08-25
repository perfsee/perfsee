import test from 'ava'

import { PrettyBytes } from '../pretty-bytes'

test('should format B', (t) => {
  t.snapshot(PrettyBytes.create(100).toString())
})

test('should format kB', (t) => {
  t.snapshot(PrettyBytes.create(12430).toString())
})

test('should format MB', (t) => {
  t.snapshot(PrettyBytes.create(12430 * 1000).toString())
})

test('should format GB', (t) => {
  t.snapshot(PrettyBytes.create(12430 * 1000 * 1000).toString())
})

test('should format with Gbit unit', (t) => {
  t.snapshot(PrettyBytes.create(12430 * 1000 * 1000, { bits: true }).toString())
})

test('should format with prefix#1', (t) => {
  t.snapshot(PrettyBytes.create(12430 * 1000 * 1000, { signed: true }).toString())
})

test('should format with prefix#2', (t) => {
  t.snapshot(PrettyBytes.create(-12430 * 1000 * 1000, { signed: true }).toString())
})

test('should format with prefix#3', (t) => {
  t.snapshot(PrettyBytes.create(0, { signed: true }).toString())
})

test('should throw if value is infinity', (t) => {
  t.throws(() => PrettyBytes.create(Infinity))
})

test('should throw if value is null', (t) => {
  // @ts-expect-error
  t.throws(() => PrettyBytes.create(null))
})

test.skip('should format in locale', (t) => {
  t.snapshot(PrettyBytes.create(10244, { locale: 'de' }).toString())
})
