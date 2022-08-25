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
  ChoiceGroup,
  IChoiceGroupOption,
  IChoiceGroupOptionStyles,
  IChoiceGroupStyles,
  TextField,
  ITextFieldStyles,
} from '@fluentui/react'
import { useModule } from '@sigi/react'
import { uniq } from 'lodash'
import { useCallback } from 'react'

import { UserEmailsInput } from '@perfsee/platform/modules/components'
import { MessageTargetType, BundleMessageSource, BundleMessageFilter, LabMessageSource } from '@perfsee/schema'

import { BasicSettingsModule, SettingKeys, Settings } from './module'
import { Field } from './style'

export const Notification = () => {
  const [state, dispatcher] = useModule(BasicSettingsModule, {
    selector: (state) => state.changing,
    dependencies: [],
  })

  const onChange = useCallback(
    (field: SettingKeys, value: any) => {
      dispatcher.updateSettingField({ field, value })
    },
    [dispatcher],
  )

  return (
    <>
      <NotificationType onChange={onChange} value={state.messageTargetType} />
      {state.messageTargetType === MessageTargetType.Specified && (
        <NotificationTarget onChange={onChange} value={state.messageTarget} />
      )}
      <BundleNotificationFilter onChange={onChange} value={state.bundleMessageFilter} />
      <BundleNotificationSource onChange={onChange} value={state.bundleMessageSource} />
      {state.bundleMessageSource === BundleMessageSource.Branch && (
        <BundleNotificationBranches onChange={onChange} value={state.bundleMessageBranches} />
      )}
      <LabNotificationSource onChange={onChange} value={state.labMessageSource} />
    </>
  )
}

interface SubSettingProps<T> {
  value: T
  onChange: (field: SettingKeys, value: T) => void
}

const choiceGroupStyles: IChoiceGroupStyles = {
  flexContainer: { display: 'flex', flexDirection: 'row' },
}
const choiceOptionStyles: IChoiceGroupOptionStyles = {
  root: { marginTop: 0, ':not(:first-child)': { marginLeft: 10 } },
}
const textInputStyles: Partial<ITextFieldStyles> = { root: { maxWidth: 400 } }

// ===== Notification Target Type Setting =====
const notificationTypeChoiceOptions: IChoiceGroupOption[] = Object.values(MessageTargetType).map((v) => ({
  key: v,
  text: v,
  styles: choiceOptionStyles,
}))
function NotificationType({ onChange, value }: SubSettingProps<MessageTargetType>) {
  const onSelect = useCallback(
    (_e: any, option?: IChoiceGroupOption) => {
      if (!option) {
        return
      }
      onChange('messageTargetType', option.key as MessageTargetType)
    },
    [onChange],
  )
  return (
    <Field name="Notification Target Type" note="Send job notification to job issuer or specified users and groups">
      <ChoiceGroup
        styles={choiceGroupStyles}
        defaultSelectedKey={value}
        options={notificationTypeChoiceOptions}
        onChange={onSelect}
      />
    </Field>
  )
}

// ===== Notification Target Setting =====
function NotificationTarget({ onChange, value }: SubSettingProps<Settings['messageTarget']>) {
  const onEmailsChange = useCallback(
    (emails: string[]) => {
      onChange('messageTarget', { ...value, userEmails: uniq(emails) })
    },
    [onChange, value],
  )

  return <UserEmailsInput label="Receiving Users" emails={value.userEmails} onChange={onEmailsChange} />
}

// ===== Bundle Notification Filter Setting =====
const bundleFilterOptions: IChoiceGroupOption[] = [
  { key: BundleMessageFilter.All, text: 'All', styles: choiceOptionStyles },
  { key: BundleMessageFilter.Warning, text: 'Only Warnings', styles: choiceOptionStyles },
  { key: BundleMessageFilter.None, text: 'Mute All', styles: choiceOptionStyles },
]
function BundleNotificationFilter({ onChange, value }: SubSettingProps<BundleMessageFilter>) {
  const onSelect = useCallback(
    (_e: any, option?: IChoiceGroupOption) => {
      if (!option) {
        return
      }
      onChange('bundleMessageFilter', option.key as BundleMessageFilter)
    },
    [onChange],
  )
  return (
    <Field name="Bundle Notification Filter" note="What kind of notification would be sent">
      <ChoiceGroup
        styles={choiceGroupStyles}
        defaultSelectedKey={value}
        options={bundleFilterOptions}
        onChange={onSelect}
      />
    </Field>
  )
}

// ===== Lab Notification Filter Setting =====
const labFilterOptions: IChoiceGroupOption[] = [
  { key: LabMessageSource.All, text: 'All', styles: choiceOptionStyles },
  { key: LabMessageSource.None, text: 'Mute All', styles: choiceOptionStyles },
]
function LabNotificationSource({ onChange, value }: SubSettingProps<LabMessageSource>) {
  const onSelect = useCallback(
    (_e: any, option?: IChoiceGroupOption) => {
      if (!option) {
        return
      }
      onChange('labMessageSource', option.key as LabMessageSource)
    },
    [onChange],
  )
  return (
    <Field name="Lab Notification Filter" note="What kind of notification would be sent">
      <ChoiceGroup
        styles={choiceGroupStyles}
        defaultSelectedKey={value}
        options={labFilterOptions}
        onChange={onSelect}
      />
    </Field>
  )
}

// ===== Bundle Notification Source Setting =====
const bundleSourceOptions: IChoiceGroupOption[] = [
  { key: BundleMessageSource.All, text: 'All', styles: choiceOptionStyles },
  { key: BundleMessageSource.Branch, text: 'Specific Branches', styles: choiceOptionStyles },
]
function BundleNotificationSource({ onChange, value }: SubSettingProps<BundleMessageSource>) {
  const onSelect = useCallback(
    (_e: any, option?: IChoiceGroupOption) => {
      if (!option) {
        return
      }
      onChange('bundleMessageSource', option.key as BundleMessageSource)
    },
    [onChange],
  )
  return (
    <Field name="Bundle Notification Source" note="Source of bundle job that would emit notification">
      <ChoiceGroup
        styles={choiceGroupStyles}
        defaultSelectedKey={value}
        options={bundleSourceOptions}
        onChange={onSelect}
      />
    </Field>
  )
}

// ===== Bundle Branches =====
function BundleNotificationBranches({ onChange, value }: SubSettingProps<string[]>) {
  const onInputChange = useCallback(
    (_e: any, input?: string) => {
      if (typeof input !== 'string') {
        return
      }
      onChange('bundleMessageBranches', uniq(input.split(',').map((id) => id.trim())))
    },
    [onChange],
  )

  const validateBranches = useCallback((input: string) => {
    if (input.includes('，')) {
      return 'Please use english comma `,` to separate branches'
    }
    return ''
  }, [])
  return (
    <Field
      name="Branches"
      note="Only jobs from given branches will emit notifications. You can set multiple branches by separating them with comma ','."
    >
      <TextField
        styles={textInputStyles}
        value={value.join(',')}
        onChange={onInputChange}
        onGetErrorMessage={validateBranches}
      />
    </Field>
  )
}
