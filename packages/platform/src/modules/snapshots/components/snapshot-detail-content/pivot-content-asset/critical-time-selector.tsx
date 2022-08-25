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

import { Checkbox, Stack } from '@fluentui/react'
import { useCallback, useMemo, useState } from 'react'

import { IconWithTips } from '@perfsee/components'
import { formatTime } from '@perfsee/platform/common'
import { LighthouseScoreType, MetricScoreSchema } from '@perfsee/shared'

import { SmallText } from './style'

export type CriticalTimeType = LighthouseScoreType | 'all'

type Props = {
  metricScores: MetricScoreSchema[]
  selectedTime: Record<string, number | undefined>
  onChange: (time: Record<string, number | undefined>) => void
}
const Metrics = {
  [LighthouseScoreType.FCP]: {
    title: 'First Contentful Paint',
    shortTitle: 'FCP',
  },
  [LighthouseScoreType.TTI]: {
    title: 'Time to Interactive',
    shortTitle: 'TTI',
  },
  [LighthouseScoreType.LCP]: {
    title: 'Largest Contentful Paint',
    shortTitle: 'LCP',
  },
  [LighthouseScoreType.FMP]: {
    title: 'First Meaningful Paint',
    shortTitle: 'FMP',
  },
}

export const CriticalTimeSelector = (props: Props) => {
  const { metricScores, onChange, selectedTime } = props

  const onCheckboxChange = useCallback(
    (type: LighthouseScoreType, time: number, checked: boolean) => {
      onChange({ ...selectedTime, [type]: checked ? time : undefined })
    },
    [onChange, selectedTime],
  )

  const count = useMemo(() => {
    return Object.values(selectedTime).filter((v) => !!v).length
  }, [selectedTime])

  const list = Object.keys(Metrics)
    .filter((type) => typeof metricScores.find((v) => v.id === type)?.value === 'number')
    .map((type) => ({
      type: type as LighthouseScoreType,
      time: metricScores.find((v) => v.id === type)!.value as number,
      title: Metrics[type].shortTitle as string,
    }))
    .sort((a, b) => a.time - b.time)
    .map(({ title, time, type }) => {
      return (
        <CheckboxWithTime count={count} onChange={onCheckboxChange} type={type} time={time} title={title} key={type} />
      )
    })

  if (!list.length) {
    return null
  }

  return (
    <Stack horizontal verticalAlign="center">
      <Stack horizontal verticalAlign="center">
        {list}
      </Stack>
      <IconWithTips
        marginLeft="4px"
        content="Select one critical time to display all requests before that critical time; select two critical times to display all requests between these two critical times."
      />
    </Stack>
  )
}

type CheckboxProps = {
  title: string
  time: number
  type: LighthouseScoreType
  count: number
  onChange: (type: LighthouseScoreType, time: number, checked: boolean) => void
}

const CheckboxWithTime = (props: CheckboxProps) => {
  const { count, type, time, onChange, title } = props

  const { value, unit } = formatTime(time)
  const [checked, setChecked] = useState<boolean>(false)

  const onCheckboxChange = useCallback(
    (_ev?: any, checked?: boolean) => {
      onChange(type, time, !!checked)
      setChecked(!!checked)
    },
    [onChange, time, type],
  )

  return (
    <Stack
      styles={{ root: { minWidth: '80px', padding: '2px 0', borderRadius: '8px' } }}
      verticalAlign="center"
      horizontalAlign="center"
      key={type}
    >
      <Checkbox
        disabled={count >= 2 && !checked}
        label={title}
        checked={checked}
        styles={{
          root: { borderRadius: '4px' },
          label: { alignItems: 'center' },
          checkbox: { fontSize: '10px', width: '12px', height: '12px' },
        }}
        onChange={onCheckboxChange}
      />
      <SmallText>{`${value}${unit}`}</SmallText>
    </Stack>
  )
}
