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

import { MessageBar, MessageBarType, PrimaryButton, Stack, StackItem, TextField } from '@fluentui/react'
import { useModuleState } from '@sigi/react'
import { useEffect } from 'react'
import { Link } from 'react-router-dom'

import { BodyContainer, useQueryString } from '@perfsee/components'
import { serverLink } from '@perfsee/platform/common'
import { staticPath } from '@perfsee/shared/routes'

import { GlobalModule } from '../shared'

import { CenterText, FormContainer, Title } from './styled'

const StatusText = {
  EMAIL_ALREADY_EXISTS: {
    message: 'Email has already been taken, try logging in using your email.',
    type: MessageBarType.error,
  },
}

export const Register = () => {
  const [{ returnUrl = '/', statusCode }] = useQueryString<{
    returnUrl: string
    statusCode: string
  }>()

  const logged = useModuleState(GlobalModule, { selector: (s) => !!s.user, dependencies: [] })

  useEffect(() => {
    if (logged) {
      location.href = returnUrl
    }
  }, [logged, returnUrl])

  return (
    <BodyContainer>
      <form
        action={serverLink`/auth/register?returnUrl=${encodeURIComponent(returnUrl)}`}
        method="POST"
        encType="application/x-www-form-urlencoded"
      >
        <FormContainer>
          <Stack tokens={{ childrenGap: 16 }}>
            {statusCode && StatusText[statusCode] && (
              <MessageBar messageBarType={StatusText[statusCode].type}>{StatusText[statusCode].message}</MessageBar>
            )}
            <Title>Perfsee</Title>

            <Stack horizontal tokens={{ childrenGap: 8 }}>
              <StackItem grow={1}>
                <TextField name="firstName" label="First Name" type="text" />
              </StackItem>
              <StackItem grow={1}>
                <TextField name="lastName" label="Last Name" type="text" />
              </StackItem>
            </Stack>
            <TextField required name="username" label="Username" minLength={5} type="text" />
            <TextField required name="email" label="Email" type="email" />
            <TextField
              required
              name="password"
              label="Password"
              type="password"
              minLength={8}
              canRevealPassword
              revealPasswordAriaLabel="Show password"
            />
            <PrimaryButton type="submit" text="Register" />
            <CenterText>
              Already have login and password? <Link to={staticPath.login}>Sign in</Link>
            </CenterText>
          </Stack>
        </FormContainer>
      </form>
    </BodyContainer>
  )
}
