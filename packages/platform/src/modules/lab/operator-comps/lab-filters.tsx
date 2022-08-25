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

import { Stack } from '@fluentui/react'
import { useCallback, FC } from 'react'

import { Select } from '@perfsee/components'
import { SnapshotTrigger } from '@perfsee/schema'

const triggerOptions = Object.entries(SnapshotTrigger).map(([name, value]) => {
  return {
    key: value,
    text: name,
  }
})

triggerOptions.push({
  // @ts-expect-error
  key: 'all',
  text: 'All',
})

type Props = {
  trigger?: SnapshotTrigger
  onChangeTrigger: (platform: string) => void
}

export const SnapshotFilters: FC<Props> = (props) => {
  const { trigger, onChangeTrigger } = props

  const onTriggerChange = useCallback(
    (key?: string) => {
      if (!key || key === 'all') {
        return
      }
      onChangeTrigger(key)
    },
    [onChangeTrigger],
  )

  return (
    <Stack tokens={{ childrenGap: '16px' }} horizontal verticalAlign="center">
      <Select title="Trigger" selectedKey={trigger ?? 'all'} options={triggerOptions} onKeyChange={onTriggerChange} />
    </Stack>
  )
}
