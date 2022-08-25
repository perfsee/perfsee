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

import { DatePicker } from '@fluentui/react'
import { FC, useCallback } from 'react'

import { Space } from '../space'

import { DatePickerDisplay } from './style'

interface DateRangeSelectorProps {
  startDate: Date
  endDate: Date
  onStartDateChanged: (startDate: Date) => void
  onEndDateChanged: (startDate: Date) => void
}

export const DateRangeSelector: FC<DateRangeSelectorProps> = ({
  startDate,
  endDate,
  onStartDateChanged,
  onEndDateChanged,
}) => {
  const handleStartDateSelect = useCallback(
    (date?: Date | null) => {
      if (date) {
        onStartDateChanged(date)
      }
    },
    [onStartDateChanged],
  )

  const handleEndDateSelect = useCallback(
    (date?: Date | null) => {
      if (date) {
        onEndDateChanged(date)
      }
    },
    [onEndDateChanged],
  )

  return (
    <Space>
      <DatePicker
        value={startDate}
        showGoToToday={false}
        placeholder="Select a start date"
        onSelectDate={handleStartDateSelect}
      />
      <b>-</b>
      <DatePicker
        value={endDate}
        showGoToToday={false}
        placeholder="Select a end date"
        onSelectDate={handleEndDateSelect}
        minDate={startDate}
      />
      <DatePickerDisplay>
        {Math.round((endDate.setHours(23, 59, 59) - startDate.setHours(0, 0, 0)) / 1000 / 60 / 60 / 24)} Day(s)
      </DatePickerDisplay>
    </Space>
  )
}
