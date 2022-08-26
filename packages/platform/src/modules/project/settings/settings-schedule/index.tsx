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

import {
  IStackTokens,
  Stack,
  PrimaryButton,
  Spinner,
  SpinnerSize,
  Dropdown,
  TextField,
  IDropdownOption,
  IIconProps,
} from '@fluentui/react'
import { useModule } from '@sigi/react'
import dayjs from 'dayjs'
import { useCallback, useEffect, useState } from 'react'

import { LabelWithTips } from '@perfsee/components'
import { notify } from '@perfsee/platform/common'
import { ScheduleMonitorType, ScheduleType } from '@perfsee/schema'

import { defaultTimer, ScheduleModule, TimerSchema } from './module'
import { PagesChoiceGroup } from './page-choice-group'
import { PropertyPayload, SettingScheduleSelectors } from './property-selectors'

const tokens: IStackTokens = {
  childrenGap: 10,
}

const dropdownStyles = {
  root: { width: '300px' },
  callout: { maxHeight: '400px', overflowY: 'scroll' },
}

const savingIconProps: IIconProps = {
  iconName: 'loading',
}

const scheduleOptions = Object.values(ScheduleType).map((type) => {
  return {
    key: type,
    text: type,
  }
})

const timesOptions = Array.from({ length: 24 }).map((_v: any, i: number) => {
  return {
    key: i,
    text: `${i}:00`.padStart(5, '0'),
  }
})

const onRenderScheduleLabel = () => {
  return (
    <LabelWithTips
      tips="Perfsee will automatically create snapshots base on this schedule."
      label="Snapshot schedule"
      required={true}
    />
  )
}

const onRenderHourLabel = () => {
  return (
    <LabelWithTips
      tips="Perfsee will run Snapshots at this interval. Maximum of every 168 hours (7 days)."
      label="Snapshot hour interval"
      required={true}
    />
  )
}

const onRenderDailyLabel = () => {
  return <LabelWithTips tips="The time is localised to Asia/Shanghai timezone." label="Time of day" required={true} />
}

const getTimerPayloadWithSchedule = (schedule: ScheduleType, timer: Partial<TimerSchema>) => {
  switch (schedule) {
    case ScheduleType.Off:
    case ScheduleType.Hourly:
      return { timeOfDay: null, hour: null }
    case ScheduleType.Daily:
      return { hour: null, timeOfDay: timer?.timeOfDay ?? 0 }
    case ScheduleType.EveryXHour:
      return { timeOfDay: null, hour: timer?.hour ?? 1 }
  }
}

export function SettingsSchedule() {
  const [{ timer, loading, saving }, dispatcher] = useModule(ScheduleModule)
  const [changing, setChanging] = useState<TimerSchema>(defaultTimer)

  useEffect(() => {
    dispatcher.getTimeSchedule()
  }, [dispatcher])

  useEffect(() => {
    setChanging(timer)
  }, [timer])

  const onScheduleChange = useCallback((_?: any, option?: IDropdownOption) => {
    const schedule = option?.key as ScheduleType
    setChanging((v) => {
      const payload = getTimerPayloadWithSchedule(schedule, v)
      return { ...v, schedule, ...payload }
    })
  }, [])

  const onTimeOfDayChange = useCallback((_?: any, option?: IDropdownOption) => {
    setChanging((v) => ({ ...v, timeOfDay: Number(option?.key ?? 0) }))
  }, [])

  const onChoiceChange = useCallback((value: ScheduleMonitorType) => {
    setChanging((v) => ({ ...v, monitorType: value }))
  }, [])

  const onHourChange = useCallback((_?: any, value?: string) => {
    setChanging((v) => ({ ...v, hour: Number(value ?? 1) }))
  }, [])

  const onPropertyChange = useCallback((payload: PropertyPayload) => {
    setChanging((v) => ({ ...v, ...payload }))
  }, [])

  const onSave = useCallback(() => {
    const { hour, monitorType, timeOfDay, pageIds, profileIds, schedule, envIds } = changing

    if (
      (monitorType === ScheduleMonitorType.Specified && !pageIds.length && !profileIds.length && !envIds.length) ||
      (typeof hour === 'number' && (hour > 168 || hour < 1))
    ) {
      notify.error({
        content: 'Failed to save.',
        duration: 3000,
      })
      return
    }

    const payloadIds = { pageIds: changing.pageIds, profileIds: changing.profileIds, envIds: changing.envIds }
    if (monitorType === ScheduleMonitorType.All || schedule === ScheduleType.Off) {
      payloadIds.pageIds = []
      payloadIds.profileIds = []
      payloadIds.envIds = []
    }
    dispatcher.saveTimer({ hour, monitorType, schedule, timeOfDay, ...payloadIds })
  }, [dispatcher, changing])

  if (loading) {
    return <Spinner size={SpinnerSize.large} label="loading settings" />
  }

  return (
    <Stack tokens={tokens}>
      <Stack horizontal tokens={tokens}>
        <Dropdown
          styles={dropdownStyles}
          selectedKey={changing.schedule ?? ScheduleType.Off}
          onRenderLabel={onRenderScheduleLabel}
          options={scheduleOptions}
          onChange={onScheduleChange}
        />
        {changing.schedule === ScheduleType.EveryXHour && (
          <TextField
            max={168}
            styles={dropdownStyles}
            value={(changing.hour ?? 1).toString()}
            type="number"
            onRenderLabel={onRenderHourLabel}
            onChange={onHourChange}
          />
        )}
        {changing.schedule === ScheduleType.Daily && (
          <Dropdown
            styles={dropdownStyles}
            selectedKey={changing?.timeOfDay ?? 0}
            onRenderLabel={onRenderDailyLabel}
            options={timesOptions}
            onChange={onTimeOfDayChange}
          />
        )}
      </Stack>
      {timer.schedule !== ScheduleType.Off && changing.schedule !== ScheduleType.Off && changing.nextTriggerTime && (
        <span>
          The next snapshot will be created at {dayjs(changing.nextTriggerTime).format('YYYY-MM-DD HH:mm:ss')}
        </span>
      )}
      {changing.schedule !== ScheduleType.Off && (
        <PagesChoiceGroup value={changing.monitorType} onChange={onChoiceChange} />
      )}
      {changing.schedule !== ScheduleType.Off && changing.monitorType === ScheduleMonitorType.Specified && (
        <SettingScheduleSelectors
          envIds={changing.envIds}
          pageIds={changing.pageIds}
          profileIds={changing.profileIds}
          onChange={onPropertyChange}
        />
      )}
      <div>
        <PrimaryButton onClick={onSave} iconProps={saving ? savingIconProps : undefined}>
          Save
        </PrimaryButton>
      </div>
    </Stack>
  )
}
