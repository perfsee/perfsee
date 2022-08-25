import test from 'ava'

import { nDaysBefore } from '../date'

test('3 days before', (t) => {
  const base = new Date('Wed Apr 06 2022')
  const result = nDaysBefore(3, base)
  t.is(result.toDateString(), 'Sun Apr 03 2022')
})

test('15 days before', (t) => {
  const base = new Date('Wed Apr 06 2022')
  const result = nDaysBefore(15, base)
  t.is(result.toDateString(), 'Tue Mar 22 2022')
})

test('90 days before', (t) => {
  const base = new Date('Wed Apr 06 2022')
  const result = nDaysBefore(90, base)
  t.is(result.toDateString(), 'Thu Jan 06 2022')
})

test('500 days before', (t) => {
  const base = new Date('Wed Apr 06 2022')
  const result = nDaysBefore(500, base)
  t.is(result.toDateString(), 'Sun Nov 22 2020')
})
