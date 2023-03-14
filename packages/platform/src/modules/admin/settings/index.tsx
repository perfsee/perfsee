import { CheckOutlined } from '@ant-design/icons'
import { useTheme } from '@emotion/react'
import { PrimaryButton, Spinner, SpinnerSize, Stack } from '@fluentui/react'
import { useForceUpdate } from '@fluentui/react-hooks'
import { useModule } from '@sigi/react'
import { useCallback, useEffect, useRef } from 'react'

import { ContentCard } from '@perfsee/components'
import { useSettings } from '@perfsee/platform/modules/shared'
import { UpdateApplicationSettingsInput } from '@perfsee/schema'

import { SettingsAdminModule } from './module'
import { SettingFieldRenderer } from './renderers'

export function Settings() {
  const theme = useTheme()
  const settings = useSettings()
  const changes = useRef<UpdateApplicationSettingsInput>(
    // @ts-expect-error undefined field value allowed
    {},
  )
  const [{ saving, saved }, dispatcher] = useModule(SettingsAdminModule)
  const forceUpdate = useForceUpdate()

  const onFieldChange = useCallback(
    (field: string, value: any) => {
      if (!settings) {
        return
      }

      if (value !== settings[field]) {
        changes.current[field] = value
      } else {
        delete changes.current[field]
      }
      forceUpdate()
    },
    [settings, changes, forceUpdate],
  )

  const save = useCallback(() => {
    if (Object.keys(changes.current).length > 0) {
      dispatcher.save(changes.current)
    }
  }, [changes, dispatcher])

  useEffect(() => {
    if (saved) {
      // @ts-expect-error undefined field value allowed
      changes.current = {}
      forceUpdate()
    }
  }, [saved, forceUpdate])

  if (!settings) {
    return <Spinner size={SpinnerSize.large} label="Loading..." />
  }

  return (
    <ContentCard>
      <Stack tokens={{ childrenGap: 20 }}>
        {Object.entries(settings).map(([field, value]) => (
          <SettingFieldRenderer
            key={field}
            field={field}
            value={changes.current[field] ?? value}
            onChange={onFieldChange}
          />
        ))}

        <Stack.Item>
          <PrimaryButton disabled={saving} onClick={save} iconProps={saving ? { iconName: 'loading' } : {}}>
            Save changes
          </PrimaryButton>
          {saved && <CheckOutlined style={{ color: theme.colors.success, marginLeft: '8px' }} />}
        </Stack.Item>
      </Stack>
    </ContentCard>
  )
}
