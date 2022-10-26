import { useTheme } from '@emotion/react'
import { Stack, Toggle, FocusZone } from '@fluentui/react'
import { startCase } from 'lodash'
import { memo, useCallback } from 'react'

import { ApplicationSettings } from '@perfsee/platform/modules/shared'

const settingsDesc: Partial<
  Record<
    keyof Omit<ApplicationSettings, '__typename'>,
    {
      desc?: string
      type: 'number' | 'string' | 'boolean' | 'array' | 'JSON'
      required?: boolean
    }
  >
> = {
  enableOauth: {
    desc: 'Whether allow user signup and login with OAuth providers',
    type: 'boolean',
  },
  enableSignup: {
    desc: 'Whether allow new user signup with email',
    type: 'boolean',
  },
  enableProjectCreate: {
    desc: 'Whether allow user create new project from any host',
    type: 'boolean',
  },
  enableProjectDelete: {
    desc: 'Whether allow user delete owned projects',
    type: 'boolean',
  },
  enableProjectImport: {
    desc: 'Whether allow user import project from git hosts',
    type: 'boolean',
  },
}

interface RendererProps {
  field: string
  value: any
  onChange: (field: string, value: any) => void
}

export const SettingFieldRenderer = memo(({ field, value, onChange }: RendererProps) => {
  const desc = settingsDesc[field]

  const onValueChange = useCallback(
    (newValue: any) => {
      onChange(field, newValue)
    },
    [field, onChange],
  )

  if (!desc) {
    return null
  }

  let Renderer: React.ComponentType<DetailedRendererProps>

  // will implement other types later
  // eslint-disable-next-line sonarjs/no-small-switch
  switch (desc.type) {
    case 'boolean':
      Renderer = ToggleRenderer
      break
    default:
      return null
  }

  return <Renderer field={field} value={value} desc={desc.desc} onChange={onValueChange} />
})

function FieldTitle({ title }: { title: string }) {
  return (
    <h3>
      <strong>{startCase(title)}</strong>
    </h3>
  )
}

function FieldDesc({ desc }: { desc: string }) {
  const theme = useTheme()
  return <p style={{ color: theme.text.colorSecondary }}>{desc}</p>
}

interface DetailedRendererProps extends RendererProps {
  desc: string
  onChange: (value: any) => void
}

function ToggleRenderer({ field, value, desc, onChange }: DetailedRendererProps) {
  const onToogle = useCallback(
    (_: any, checked?: boolean) => {
      if (typeof checked === 'boolean') {
        onChange(checked)
      }
    },
    [onChange],
  )

  return (
    <FocusZone>
      <Stack horizontal horizontalAlign="space-between" verticalAlign="end">
        <Stack>
          <FieldTitle title={field}> </FieldTitle>
          <FieldDesc desc={desc} />
        </Stack>
        <Toggle checked={value} onChange={onToogle} />
      </Stack>
    </FocusZone>
  )
}
