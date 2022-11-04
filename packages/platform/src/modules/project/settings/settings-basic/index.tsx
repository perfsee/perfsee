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

import { IStackTokens, Stack, PrimaryButton, IIconProps, Spinner, SpinnerSize } from '@fluentui/react'
import { useModule } from '@sigi/react'
import { useEffect } from 'react'

import { BasicInfo } from './basic-info'
import { BetaFeatures } from './beta-feature'
import { DangerZone } from './danger-zone'
import { BasicSettingsModule } from './module'
import { Notification } from './notification'
import { Field } from './style'

const tokens: IStackTokens = {
  childrenGap: 18,
}

const savingIconProps: IIconProps = {
  iconName: 'loading',
}
export function SettingsBasic() {
  const [state, dispatcher] = useModule(BasicSettingsModule)

  useEffect(() => {
    dispatcher.getSettings()

    return () => {
      dispatcher.clearProjectChange()
    }
  }, [dispatcher])

  if (state.loading || !state.changing) {
    return <Spinner size={SpinnerSize.large} label="loading settings" />
  }

  return (
    <Stack tokens={tokens}>
      <BasicInfo />
      <Notification />
      <BetaFeatures />
      <Field>
        <PrimaryButton
          onClick={dispatcher.saveSettings}
          disabled={state.saving}
          iconProps={state.saving ? savingIconProps : undefined}
        >
          Save
        </PrimaryButton>
      </Field>
      <DangerZone />
    </Stack>
  )
}
