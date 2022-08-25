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

import { GithubOutlined } from '@ant-design/icons'
import {
  MessageBar,
  MessageBarType,
  PrimaryButton,
  Separator,
  Spinner,
  SpinnerSize,
  Stack,
  TextField,
} from '@fluentui/react'
import { useModule, useModuleState } from '@sigi/react'
import { useEffect } from 'react'
import { Link } from 'react-router-dom'

import { BodyContainer, useQueryString } from '@perfsee/components'
import { staticPath } from '@perfsee/shared/routes'

import { UserModule } from '../shared'

import { LoginModule } from './login.module'
import { BlockButton, CenterText, FormContainer } from './styled'

const Oauth2Provider = {
  github: {
    name: 'Github',
    icon: <GithubOutlined />,
  },
}

const StatusText = {
  INVALID_PASSWORD: { message: 'Invalid email or password', type: MessageBarType.error },
  PASSWORD_HAS_RESET: { message: 'Your password has been reset', type: MessageBarType.info },
  RESET_EMAIL_SENT: {
    message: 'Check your email and spam folder for a link to reset your password.',
    type: MessageBarType.info,
  },
  EMAIL_ALREADY_EXISTS: {
    message: 'Email has already been taken, try logging in using your email.',
    type: MessageBarType.error,
  },
  EXTERN_USERNAME_TAKEN: {
    message: 'The account has been connected to others, try logging in.',
    type: MessageBarType.error,
  },
}

export const Login = () => {
  const [{ returnUrl = SERVER, statusCode }] = useQueryString<{
    returnUrl: string
    statusCode: string
  }>()

  const [{ oauthProviders, loading: oauthProvidersLoading }, dispatch] = useModule(LoginModule)

  const logged = useModuleState(UserModule, { selector: (s) => !!s.user, dependencies: [] })

  useEffect(() => {
    dispatch.getOauthProviders()
  }, [dispatch])

  useEffect(() => {
    if (logged) {
      location.href = returnUrl || '/'
    }
  }, [logged, returnUrl])

  return (
    <BodyContainer>
      <form
        action={SERVER + '/auth/login?returnUrl=' + encodeURIComponent(returnUrl)}
        method="POST"
        encType="application/x-www-form-urlencoded"
      >
        <FormContainer>
          <Stack tokens={{ childrenGap: 16 }}>
            {statusCode && StatusText[statusCode] && (
              <MessageBar messageBarType={StatusText[statusCode].type}>{StatusText[statusCode].message}</MessageBar>
            )}
            <TextField required name="email" label="Email" type="email" />
            <TextField
              required
              name="password"
              label="Password"
              type="password"
              canRevealPassword
              revealPasswordAriaLabel="Show password"
            />

            <PrimaryButton type="submit" text="Sign in" />
            <Link to={staticPath.register}>
              <BlockButton text="Register" />
            </Link>
            <CenterText>
              Forgot your password? <Link to={staticPath.me.resetPassword}>Reset password</Link>
            </CenterText>
            <Separator />
            {oauthProvidersLoading ? (
              <Spinner size={SpinnerSize.large} />
            ) : (
              oauthProviders?.map((provider) => {
                const { name = provider, icon } = Oauth2Provider[provider] ?? {}
                return (
                  <a
                    key={provider}
                    href={`/oauth2/login?returnUrl=${encodeURIComponent(returnUrl)}&provider=${provider}`}
                  >
                    <BlockButton>
                      {icon}
                      {icon && <>&nbsp;</>}
                      {name}
                    </BlockButton>
                  </a>
                )
              })
            )}
          </Stack>
        </FormContainer>
      </form>
    </BodyContainer>
  )
}
