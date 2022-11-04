import { Toggle } from '@fluentui/react'
import { useModule } from '@sigi/react'
import { useCallback } from 'react'

import { BasicSettingsModule, SettingKeys } from './module'
import { BetaFeature, Field } from './style'

export const BetaFeatures = () => {
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

  const handleToggleAutoDetectVersion = useCallback(
    (_e: any, checked?: boolean) => {
      onChange('autoDetectVersion', !!checked)
    },
    [onChange],
  )

  return (
    <div>
      <Field
        name={
          <>
            Automatically detect version in lab <BetaFeature>Beta</BetaFeature>
          </>
        }
        note="Analyze which version of artifact is running from the lab data."
      >
        <Toggle onText="On" offText="Off" checked={state.autoDetectVersion} onChange={handleToggleAutoDetectVersion} />
      </Field>
    </div>
  )
}
