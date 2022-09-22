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

import {
  DefaultButton,
  Dialog,
  DialogFooter,
  DialogType,
  PrimaryButton,
  TooltipHost,
  Stack,
  Text,
} from '@fluentui/react'
import { useModule } from '@sigi/react'
import dayjs from 'dayjs'
import { useCallback, useEffect, useRef } from 'react'

import { ForeignLink, useToggleState } from '@perfsee/components'

import { AccessTokenModule } from './access-token.module'
import { GenerateToken } from './generate-token'
import { Container, ListWrap, TokenItem, TokenName, TokenHeader, DeleteIcon } from './styled'

export const AccessToken = () => {
  const [{ tokens, generateResult }, dispatcher] = useModule(AccessTokenModule)
  const [deleteDialogVisible, showDelete, hideDelete] = useToggleState(false)

  const deletingName = useRef<string | null>(null)

  const onShowDeleteDialog = useCallback(
    (name: string) => () => {
      showDelete()
      deletingName.current = name
    },
    [showDelete],
  )

  const onCancelDelete = useCallback(() => {
    hideDelete()
    deletingName.current = null
  }, [hideDelete])

  const onConfirmDelete = useCallback(() => {
    if (deletingName.current) {
      dispatcher.deleteAccessToken(deletingName.current)
      deletingName.current = null
    }

    hideDelete()
  }, [dispatcher, hideDelete])

  const onHideResult = useCallback(() => {
    dispatcher.setGenerateResult(null)
  }, [dispatcher])

  useEffect(() => {
    dispatcher.getAccessTokens()
  }, [dispatcher])

  return (
    <>
      <Container>
        <Stack>
          <div>
            <GenerateToken
              generateResult={generateResult}
              onGenerate={dispatcher.generateToken}
              onHideResult={onHideResult}
            />
          </div>
          <Text variant="small">
            Check out <ForeignLink href="https://perfsee.com/docs/api">Perfsee API</ForeignLink> docs.
          </Text>
        </Stack>
        <ListWrap>
          {tokens.map((token) => (
            <TokenItem key={token.name}>
              <TokenHeader>
                <TokenName>{token.name}</TokenName>
                <TooltipHost content="Delete this token">
                  <DeleteIcon onClick={onShowDeleteDialog(token.name)} />
                </TooltipHost>
              </TokenHeader>
              <span>created at: {dayjs(token.createdAt).format('YYYY/MM/DD HH:mm')}</span>
              <span>last used at: {dayjs(token.lastUsedAt).format('YYYY/MM/DD HH:mm')}</span>
            </TokenItem>
          ))}
        </ListWrap>
      </Container>
      <Dialog
        dialogContentProps={{
          type: DialogType.normal,
          title: 'Delete token',
          subText: 'Are you sure to delete this token?',
        }}
        hidden={!deleteDialogVisible}
        styles={{
          main: {
            'div&': {
              width: '400px',
              maxWidth: '400px',
            },
          },
        }}
        onDismiss={onCancelDelete}
      >
        <DialogFooter>
          <PrimaryButton onClick={onConfirmDelete}>Confirm</PrimaryButton>
          <DefaultButton onClick={onCancelDelete}>Cancel</DefaultButton>
        </DialogFooter>
      </Dialog>
    </>
  )
}
