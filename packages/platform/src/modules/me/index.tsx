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

import { INavLink, INavLinkGroup, PersonaSize, Stack, Text } from '@fluentui/react'
import { useModule, useModuleState } from '@sigi/react'
import { useCallback, useEffect } from 'react'
import { Link, Switch, useHistory } from 'react-router-dom'

import { BodyContainer, ContentCard, Route } from '@perfsee/components'
import { staticPath } from '@perfsee/shared/routes'

import { SecondaryNav } from '../layout'
import { ConnectedAccount, ConnectedAccountsModule, GlobalModule } from '../shared'

import { AccessToken } from './access-token'
import { Account } from './account'
import { UserAvatar } from './avatar'
import { Title } from './styled'

export const Me = () => {
  const { user } = useModuleState(GlobalModule)

  if (!user) {
    return null
  }

  return (
    <Stack tokens={{ childrenGap: 24 }}>
      <Stack tokens={{ childrenGap: 8 }}>
        <Title>Account</Title>
        <UserAvatar size={PersonaSize.size72} />
        <Text variant="xLarge">{user.username}</Text>
        <Text variant="medium">{user.email}</Text>
      </Stack>
      <Stack.Item>
        <Title>Actions</Title>
        <Text variant="medium">
          <a href={SERVER + '/auth/logout'}>Logout</a>
        </Text>
        <br />
        <Text variant="medium">
          <Link to={staticPath.resetPassword}>Reset Password</Link>
        </Text>
      </Stack.Item>
    </Stack>
  )
}

export const ConnectedAccounts = () => {
  const [{ connectedAccounts }, dispatch] = useModule(ConnectedAccountsModule)

  useEffect(() => {
    dispatch.getConnectedAccounts()

    return dispatch.reset
  }, [dispatch])

  const onDisconnect = useCallback((account: ConnectedAccount) => dispatch.disconnectedAccounts(account), [dispatch])

  return (
    <Stack tokens={{ childrenGap: 24 }}>
      <Stack.Item>
        <Title>Connected Accounts</Title>
        {connectedAccounts?.map((account) => (
          <Account key={account.provider} account={account} onDisconnect={onDisconnect} />
        ))}
      </Stack.Item>
    </Stack>
  )
}

const navGroups: INavLinkGroup[] = [
  {
    links: [
      {
        name: 'Account',
        key: staticPath.me.home,
        url: '',
        icon: 'settings',
      },
      {
        name: 'Connected accounts',
        key: staticPath.me.connectedAccounts,
        url: '',
        icon: 'user',
      },
      {
        name: 'Personal access tokens',
        key: staticPath.me.accessToken,
        url: '',
        icon: 'key',
      },
    ],
  },
]

const MePage = () => {
  const history = useHistory()

  const onNavigate = useCallback(
    (_: any, item?: INavLink) => {
      if (item?.key && history.location.pathname !== item.key) {
        history.push(item.key)
      }
    },
    [history],
  )

  return (
    <BodyContainer>
      <Stack horizontal>
        <SecondaryNav groups={navGroups} selectedKey={history.location.pathname} onLinkClick={onNavigate} />
        <Stack.Item grow>
          <ContentCard>
            <Switch>
              <Route exact={true} path={staticPath.me.home} component={Me} />
              <Route exact={true} path={staticPath.me.connectedAccounts} component={ConnectedAccounts} />
              <Route exact={true} path={staticPath.me.accessToken} component={AccessToken} />
              <Route exact={true} path={staticPath.me.billing} component={Me} />
            </Switch>
          </ContentCard>
        </Stack.Item>
      </Stack>
    </BodyContainer>
  )
}

export default MePage
