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

import { DefaultButton, Text } from '@fluentui/react'
import { useModule } from '@sigi/react'
import { useCallback, useEffect } from 'react'
import { Link } from 'react-router-dom'

import { BodyContainer } from '@perfsee/components'
import { staticPath } from '@perfsee/shared/routes'

import { ConnectedAccount, ConnectedAccountsModule } from '../shared'

import { Account } from './account'
import { Container } from './styled'

export const Me = () => {
  const [{ connectedAccounts }, dispatch] = useModule(ConnectedAccountsModule)

  useEffect(() => {
    dispatch.getConnectedAccounts()

    return dispatch.reset
  }, [dispatch])

  const onDisconnect = useCallback((account: ConnectedAccount) => dispatch.disconnectedAccounts(account), [dispatch])

  return (
    <BodyContainer>
      <Container tokens={{ childrenGap: 16 }}>
        <Text variant="xLarge">Connected Accounts</Text>
        {connectedAccounts?.map((account) => (
          <Account key={account.provider} account={account} onDisconnect={onDisconnect} />
        ))}
        <br />
        <br />
        <br />
        <a href={SERVER + '/auth/logout'}>
          <DefaultButton>Logout</DefaultButton>
        </a>
        <br />
        <Link to={staticPath.me.resetPassword}>
          <DefaultButton>Reset Password</DefaultButton>
        </Link>
      </Container>
    </BodyContainer>
  )
}
