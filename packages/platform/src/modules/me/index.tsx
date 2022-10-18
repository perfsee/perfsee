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

import { Icon, PersonaSize, Stack, Text } from '@fluentui/react'
import { useModule, useModuleState } from '@sigi/react'
import { useCallback, useEffect } from 'react'
import { Link, Switch } from 'react-router-dom'

import { BodyContainer, BodyPadding, Route } from '@perfsee/components'
import { staticPath } from '@perfsee/shared/routes'

import { ConnectedAccount, ConnectedAccountsModule, GlobalModule } from '../shared'

import { AccessToken } from './access-token'
import { Account } from './account'
import { UserAvatar } from './avatar'
import { NavbarContainer, NavbarItem as StyledNavbarItem, PageLayout, Title } from './styled'

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

const navbarItemStyle = (isActive: boolean) => ({
  borderLeft: '3px solid ' + (isActive ? '#000' : 'transparent'),
  background: isActive ? '#eee' : undefined,
  fontWeight: isActive ? 600 : undefined,
})
const NavbarItem: React.FunctionComponent<{ to: string; children: React.ReactNode }> = ({ to, children }) => {
  return (
    <StyledNavbarItem exact to={to} style={navbarItemStyle}>
      {children}
    </StyledNavbarItem>
  )
}

const Navbar = () => {
  return (
    <NavbarContainer>
      <NavbarItem to={staticPath.me.home}>
        <Icon iconName="settings" /> Account
      </NavbarItem>
      <NavbarItem to={staticPath.me.connectedAccounts}>
        <Icon iconName="user" /> Connected accounts
      </NavbarItem>
      <NavbarItem to={staticPath.me.accessToken}>
        <Icon iconName="key" /> Personal access tokens
      </NavbarItem>
      <NavbarItem to={staticPath.me.billing}>
        <Icon iconName="creditCard" /> Billing (coming soon)
      </NavbarItem>
    </NavbarContainer>
  )
}

const MePage = () => {
  return (
    <BodyContainer>
      <BodyPadding>
        <PageLayout tokens={{ childrenGap: 32 }}>
          <Navbar />
          <Stack.Item grow={1} tokens={{ padding: '0 16px' }}>
            <Switch>
              <Route exact={true} path={staticPath.me.home} component={Me} />
              <Route exact={true} path={staticPath.me.connectedAccounts} component={ConnectedAccounts} />
              <Route exact={true} path={staticPath.me.accessToken} component={AccessToken} />
              <Route exact={true} path={staticPath.me.billing} component={Me} />
            </Switch>
          </Stack.Item>
        </PageLayout>
      </BodyPadding>
    </BodyContainer>
  )
}

export default MePage
