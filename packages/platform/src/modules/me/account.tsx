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

import { DefaultButton, Dialog, DialogFooter, Persona, PrimaryButton, Stack, TooltipHost } from '@fluentui/react'
import { useCallback, useState } from 'react'

import { IconToggleButton } from '@perfsee/components'

import { ConnectedAccount } from '../shared/connected-accounts.module'

export const Account = ({
  account,
  onDisconnect,
}: {
  account: ConnectedAccount
  onDisconnect: (account: ConnectedAccount) => void
}) => {
  const connected = !!account.externUsername

  const [disconnectDialogVisible, setDisconnectDialogVisible] = useState(false)

  const closeDisconnectDialog = useCallback(() => setDisconnectDialogVisible(false), [])
  const showDisconnectDialog = useCallback(() => setDisconnectDialogVisible(true), [])

  const onClickDisconnect = useCallback(() => {
    closeDisconnectDialog()
    onDisconnect(account)
  }, [account, closeDisconnectDialog, onDisconnect])

  const onClickConnect = useCallback(() => {
    location.href = `/oauth2/login?returnUrl=${encodeURIComponent(location.href)}&provider=${account.provider}`
  }, [account])

  return (
    <Stack key={account.provider} horizontal verticalAlign="center">
      <Persona
        text={account.provider}
        size={12}
        secondaryText={connected ? `connected with '${account.externUsername}'` : 'not connected'}
      />
      <TooltipHost content={connected ? 'disconnect' : 'connect'}>
        <IconToggleButton
          iconProps={{ iconName: connected ? 'PlugConnected' : 'PlugDisconnected' }}
          hoveredIconProps={{ iconName: connected ? 'PlugDisconnected' : 'PlugConnected' }}
          toggle={connected}
          onClick={connected ? showDisconnectDialog : onClickConnect}
        />
      </TooltipHost>
      <Dialog
        hidden={!disconnectDialogVisible}
        onDismiss={closeDisconnectDialog}
        dialogContentProps={{
          title: `Disconnect ${account.provider}`,
          subText: `Do you want to disconnect the ${account.provider} account "${account.externUsername}"?`,
        }}
        modalProps={{ isBlocking: false }}
      >
        <DialogFooter>
          <PrimaryButton onClick={onClickDisconnect} text="Yes" />
          <DefaultButton onClick={closeDisconnectDialog} text="No" />
        </DialogFooter>
      </Dialog>
    </Stack>
  )
}
