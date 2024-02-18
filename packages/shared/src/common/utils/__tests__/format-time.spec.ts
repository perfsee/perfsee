import test from 'ava'

import { formatTime } from '../format-time'

test('should format ms', (t) => {
  const fixture = 120
  const { value, unit } = formatTime(fixture)
  t.is(value, fixture.toString())
  t.is(unit, 'ms')
})

test('should format sec', (t) => {
  const fixture = 12000
  const { value, unit } = formatTime(fixture)
  t.is(value, (fixture / 1000).toString())
  t.is(unit, 'sec')
})

test('should format min', (t) => {
  const fixture = 723000
  const { value, unit } = formatTime(fixture)
  t.is(value, (fixture / 1000 / 60).toString())
  t.is(unit, 'min')
})

test('the length of value after dot should not be greater than 2', (t) => {
  const fixture = 7231233
  const { value } = formatTime(fixture)
  t.truthy(value.split('.')[1].length <= 2)
})
