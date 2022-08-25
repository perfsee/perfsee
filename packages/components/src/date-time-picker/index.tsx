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

import { DefaultButton, IContextualMenuProps, Calendar, ICalendarProps, TextField } from '@fluentui/react'
import dayjs from 'dayjs'
import { useCallback, useMemo, FC } from 'react'

type Props = ICalendarProps & {
  value: Date
  onChange: (date: Date) => void
}
export const DateTimePicker: FC<Props> = (props) => {
  const { value, onChange, minDate, maxDate } = props
  const time = dayjs(value).format('HH:mm')

  const onSelectDate = useCallback(
    (date: Date) => {
      onChange(date)
    },
    [onChange],
  )

  const onTimeChange = useCallback(
    (_e: any, date?: string) => {
      if (date) {
        const [hour, minutes] = date.split(':').map((v) => parseInt(v, 10))
        onChange(new Date(value.setHours(hour, minutes)))
      }
    },
    [onChange, value],
  )

  const renderMenuList = useCallback(() => {
    return (
      <div>
        <Calendar
          onSelectDate={onSelectDate}
          value={value}
          showMonthPickerAsOverlay
          highlightSelectedMonth
          showGoToToday={false}
          minDate={minDate}
          maxDate={maxDate}
        />
        <TextField value={time} type="time" onChange={onTimeChange} />
      </div>
    )
  }, [onSelectDate, onTimeChange, minDate, maxDate, time, value])

  const menuProps: IContextualMenuProps = useMemo(
    () => ({
      onRenderMenuList: renderMenuList,
      shouldFocusOnMount: true,
      items: [{ key: '' }], // to make menu render
    }),
    [renderMenuList],
  )

  return (
    <DefaultButton
      styles={{ menuIcon: { margin: '0 0 0 16px' } }}
      menuIconProps={{ iconName: 'Calendar' }}
      menuProps={menuProps}
    >
      {dayjs(value).format('YYYY-MM-DD HH:mm')}
    </DefaultButton>
  )
}
