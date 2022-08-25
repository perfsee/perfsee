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

import { ChoiceGroup, IChoiceGroupOption, IChoiceGroupStyles, IChoiceGroupOptionStyles } from '@fluentui/react'
import { useCallback } from 'react'

import { ScheduleMonitorType } from '@perfsee/schema'

import { Field } from '../settings-basic/style'

const choiceOptionStyles: IChoiceGroupOptionStyles = {
  root: { marginTop: 0, ':not(:first-child)': { marginLeft: 10 } },
}
const choiceGroupStyles: IChoiceGroupStyles = {
  flexContainer: { display: 'flex', flexDirection: 'row' },
}
// ===== Page Filter Setting =====
const filterOptions: IChoiceGroupOption[] = [
  { key: ScheduleMonitorType.All, text: 'All', styles: choiceOptionStyles },
  { key: ScheduleMonitorType.Specified, text: 'Specified', styles: choiceOptionStyles },
]

type Props = {
  onChange: (value: ScheduleMonitorType) => void
  value: ScheduleMonitorType
}

export function PagesChoiceGroup({ onChange, value }: Props) {
  const onSelect = useCallback(
    (_e: any, option?: IChoiceGroupOption) => {
      if (!option) {
        return
      }
      onChange(option.key as ScheduleMonitorType)
    },
    [onChange],
  )
  return (
    <Field name="Pages Monitor Filter" note="Which pages do you need to monitor?">
      <ChoiceGroup styles={choiceGroupStyles} defaultSelectedKey={value} options={filterOptions} onChange={onSelect} />
    </Field>
  )
}
