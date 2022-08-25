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

import { useCallback } from 'react'

import { SingleSelector } from '@perfsee/components'

export type TimeItemSchema = {
  id: string
  name: string
  from: string
}

export const getFromTime = (day: number) => new Date(new Date().getTime() - 1000 * day * 86400).toISOString()

export const TimeItems: TimeItemSchema[] = [
  {
    id: '15-days',
    name: '15 days',
    from: getFromTime(15),
  },
  {
    id: '1-month',
    name: '1 month',
    from: getFromTime(30),
  },
  {
    id: '3-months',
    name: '3 months',
    from: getFromTime(90),
  },
  {
    id: '6-months',
    name: '6 months',
    from: getFromTime(180),
  },
]

export const TimeRangeSelector = (props: { time: TimeItemSchema; onChange: (time: TimeItemSchema) => void }) => {
  const { time, onChange } = props
  const onTimeChange = useCallback(
    (id: string) => {
      const selectedTime = TimeItems.find((v) => v.id === id)
      if (selectedTime) {
        onChange(selectedTime)
      }
    },
    [onChange],
  )

  return <SingleSelector isFirst={true} id={time.id} options={TimeItems} onChange={onTimeChange} />
}
