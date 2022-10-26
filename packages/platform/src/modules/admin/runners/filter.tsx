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

import styled from '@emotion/styled'
import { Stack, Icon, getTheme, DefaultButton, Checkbox, ComboBox, IComboBoxOption } from '@fluentui/react'
import { useModule } from '@sigi/react'
import { useCallback, useEffect, useMemo } from 'react'

import { Tag } from '@perfsee/components'
import { JobType } from '@perfsee/schema'

import { PropertyModule } from '../../shared'

import { JobTypeSelector } from './job-type-selector'
import { RunnersModule } from './module'

const InlineCode = styled.code(({ theme }) => theme.markdown.inlineCode)

export function RunnersFilter() {
  const theme = getTheme()
  const [zones, propertyDispatcher] = useModule(PropertyModule, {
    selector: (state) => state.zones.map((zone) => ({ key: zone, text: zone })),
    dependencies: [],
  })

  const [{ filter, registrationToken }, dispatcher] = useModule(RunnersModule, {
    selector: (state) => ({ filter: state.filter, registrationToken: state.registrationToken }),
    dependencies: [],
  })

  const callbacks = useMemo(
    () => ({
      onClear: (key: string) => {
        dispatcher.setFilter({
          [key]: undefined,
        })
      },
      onJobTypeChange: (jobType: JobType) => {
        dispatcher.setFilter({
          jobType: jobType,
        })
      },
      onOnlineStatusChange: (_: any, checked: boolean | undefined) => {
        dispatcher.setFilter({
          online: checked,
        })
      },
      onActiveStatusChange: (_: any, checked: boolean | undefined) => {
        dispatcher.setFilter({
          active: checked,
        })
      },
      onZoneChange: (_: any, option?: IComboBoxOption) => {
        if (option) {
          dispatcher.setFilter({
            zone: option.key as string,
          })
        }
      },
      onClearAll: () => {
        dispatcher.clearFilter()
      },
    }),
    [dispatcher],
  )

  useEffect(() => {
    if (!zones.length) {
      propertyDispatcher.fetchSettingProperty()
    }
  }, [zones, propertyDispatcher])

  return (
    <Stack tokens={{ childrenGap: 10 }} verticalAlign="start">
      <Stack tokens={{ childrenGap: 10 }}>
        <p>
          Runner registration token: <InlineCode>{registrationToken}</InlineCode>
        </p>
        <Stack horizontal tokens={{ childrenGap: 10 }}>
          <JobTypeSelector
            label="Job Type"
            jobType={filter.jobType}
            onChange={callbacks.onJobTypeChange}
            styles={{ dropdown: { width: 200 } }}
          />
          <ComboBox
            label="Zone"
            selectedKey={filter.zone}
            options={zones}
            onChange={callbacks.onZoneChange}
            useComboBoxAsMenuWidth
          />
        </Stack>
        <Stack horizontal tokens={{ childrenGap: 10 }}>
          <Checkbox label="online" checked={!!filter.online} onChange={callbacks.onOnlineStatusChange} />
          <Checkbox label="active" checked={!!filter.active} onChange={callbacks.onActiveStatusChange} />
        </Stack>
      </Stack>
      {Object.keys(filter).length > 0 && (
        <Stack
          horizontal
          wrap
          horizontalAlign="start"
          tokens={{ childrenGap: 4 }}
          styles={{
            root: {
              borderTop: `1px solid ${theme.palette.neutralLight}`,
              paddingTop: 6,
            },
          }}
        >
          {Object.entries(filter)
            .filter(([, val]) => val !== null && val !== undefined)
            .map(([key, val]) => (
              <FilterTag key={key} name={key} value={String(val)} onClear={callbacks.onClear} />
            ))}
        </Stack>
      )}
      <DefaultButton onClick={callbacks.onClearAll}>Clear Filters</DefaultButton>
    </Stack>
  )
}

function FilterTag({ name, value, onClear }: { name: string; value: string; onClear: (key: string) => void }) {
  const clear = useCallback(() => {
    onClear(name)
  }, [name, onClear])
  return (
    <Tag>
      {name}: {value} <Icon onClick={clear} iconName="clear" styles={{ root: { paddingLeft: 6 } }} />
    </Tag>
  )
}
