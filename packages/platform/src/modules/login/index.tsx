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
import { MessageBar, MessageBarType, PrimaryButton, Separator, Stack, TextField } from '@fluentui/react'
import { useModuleState } from '@sigi/react'
import { useEffect } from 'react'
import { Link } from 'react-router-dom'

import { BodyContainer, ForeignLink, useQueryString } from '@perfsee/components'
import { staticPath } from '@perfsee/shared/routes'

import { GlobalModule, useSettings } from '../shared'

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
  GITHUB_NO_PUBLIC_EMAIL: {
    message: (
      <>
        Your Github account does not have a public email address, please go to{' '}
        <ForeignLink href="https://github.com/settings/profile">your profile</ForeignLink> to set a public email
        address, or use <Link to={staticPath.register}>email to register</Link>.
      </>
    ),
    type: MessageBarType.error,
  },
}

export const Login = () => {
  const settings = useSettings()
  const [{ returnUrl = SERVER, statusCode }] = useQueryString<{
    returnUrl: string
    statusCode: string
  }>()

  const logged = useModuleState(GlobalModule, { selector: (s) => !!s.user, dependencies: [] })

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
            {settings.enableSignup && (
              <>
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
                  Forgot your password? <Link to={staticPath.resetPassword}>Reset password</Link>
                </CenterText>
              </>
            )}
            {settings.enableOauth && (
              <>
                <Separator />
                {settings.oauthProviders.map((provider) => {
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
                })}
              </>
            )}
          </Stack>
        </FormContainer>
      </form>
    </BodyContainer>
  )
}
