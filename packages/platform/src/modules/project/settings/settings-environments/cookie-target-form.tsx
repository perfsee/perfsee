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

import { QuestionCircleOutlined } from '@ant-design/icons'
import {
  IChoiceGroupOptionStyles,
  IChoiceGroupStyles,
  IChoiceGroupOption,
  ChoiceGroup,
  Stack,
  TooltipHost,
} from '@fluentui/react'
import { useModuleState } from '@sigi/react'
import { forwardRef, useCallback, useImperativeHandle, useMemo, useState } from 'react'

import { ForeignLink } from '@perfsee/components'
import { UserEmailsInput } from '@perfsee/platform/modules/components'
import { GlobalModule } from '@perfsee/platform/modules/shared'
import { CookieTargetType } from '@perfsee/schema'
import { staticPath } from '@perfsee/shared/routes'

const choiceGroupStyles: IChoiceGroupStyles = {
  flexContainer: { display: 'flex', flexDirection: 'row' },
}
const choiceOptionStyles: IChoiceGroupOptionStyles = {
  root: { marginTop: 0, ':not(:first-child)': { marginLeft: 10 } },
}

interface SubEnvProps<T> {
  value: T
  onChange: (field: string, value: T) => void
}

const cookeiTargetTypeChoiceOptions: IChoiceGroupOption[] = [
  {
    key: CookieTargetType.Issuer,
    text: CookieTargetType.Issuer,
    styles: choiceOptionStyles,
  },
  {
    key: 'Mine',
    text: 'Mine',
    styles: choiceOptionStyles,
  },
]

function CookieType({ onChange, value, target }: SubEnvProps<CookieTargetType | string> & { target?: string | null }) {
  const { user } = useModuleState(GlobalModule)
  const onSelect = useCallback(
    (_e: any, option?: IChoiceGroupOption) => {
      if (!option) {
        return
      }
      if (option.key === 'Mine' && user?.email) {
        onChange('cookieTargetType', CookieTargetType.Specified)
        onChange('cookieTarget', user.email)
        return
      }
      onChange('cookieTargetType', option.key as CookieTargetType)
    },
    [onChange, user?.email],
  )

  const options = useMemo(() => {
    if (value === CookieTargetType.Specified && target !== user?.email) {
      return cookeiTargetTypeChoiceOptions.concat({
        key: CookieTargetType.Specified,
        text: CookieTargetType.Specified,
        styles: choiceOptionStyles,
      })
    }
    return cookeiTargetTypeChoiceOptions
  }, [value, user, target])

  return (
    <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 12 }}>
      <div>
        Use personal cookies of{' '}
        {
          <TooltipHost
            content={
              <ForeignLink href={staticPath.docs.home + '/settings/environment-setting#use-personal-cookies'}>
                Use chrome extension to upload personal cookies.
              </ForeignLink>
            }
            closeDelay={1000}
          >
            <QuestionCircleOutlined />
          </TooltipHost>
        }
      </div>
      <ChoiceGroup styles={choiceGroupStyles} defaultSelectedKey={value} options={options} onChange={onSelect} />
    </Stack>
  )
}

function CookieTarget({ value }: SubEnvProps<string | null | undefined>) {
  return <UserEmailsInput label="" emails={[value].filter(Boolean) as string[]} readonly />
}

export interface FormCookieTargetProps {
  defaultTargetType?: CookieTargetType | null | 'Mine'
  defaultCookieTarget?: string | null
}

export const FormCookieTarget = forwardRef((props: FormCookieTargetProps, ref) => {
  const { user } = useModuleState(GlobalModule)

  const [env, setEnv] = useState({
    cookieTargetType:
      props.defaultTargetType === CookieTargetType.Specified && props.defaultCookieTarget === user?.email
        ? 'Mine'
        : props.defaultTargetType === CookieTargetType.Specified
        ? CookieTargetType.Specified
        : CookieTargetType.Issuer,
    cookieTarget: props.defaultCookieTarget,
  })

  useImperativeHandle(
    ref,
    () => {
      return {
        getCookieTarget: () => {
          return {
            ...env,
            cookieTargetType: env.cookieTargetType === 'Mine' ? CookieTargetType.Specified : env.cookieTargetType,
          }
        },
      }
    },
    [env],
  )

  const onChange = useCallback((field: string, value: any) => {
    setEnv((prev) => ({
      ...prev,
      [field]: value,
    }))
  }, [])

  return (
    <Stack horizontal verticalAlign="end" tokens={{ childrenGap: 8 }}>
      <CookieType value={env.cookieTargetType} onChange={onChange} target={env.cookieTarget} />
      {[CookieTargetType.Specified, 'Mine'].includes(env.cookieTargetType) ? (
        <Stack style={{ marginTop: -4 }}>
          <CookieTarget value={env.cookieTarget} onChange={onChange} />
        </Stack>
      ) : null}
    </Stack>
  )
})
