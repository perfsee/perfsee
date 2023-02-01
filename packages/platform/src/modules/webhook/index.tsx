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

import { useTheme } from '@emotion/react'
import { Icon, PrimaryButton, Shimmer, Stack, TooltipHost } from '@fluentui/react'
import { useModule } from '@sigi/react'
import { pick } from 'lodash'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { Empty, ForeignLink } from '@perfsee/components'
import { staticPath } from '@perfsee/shared/routes'

import { DialogVisible, SettingDialogs } from '../project/settings/settings-common-comp'

import { WebhookEditAction, WebhookRemoveAction, WebhooksDescription, WebhooksTable, WebhooksTableItem } from './style'
import { WebhookEditForm } from './webhook-edit-form'
import { Webhook, WebhookModule, WebhookSchema } from './webhook.module'

export const WebhookSettings = ({ applicationId }: { applicationId?: number }) => {
  const [{ webhooks, loading }, dispatcher] = useModule(WebhookModule)

  const [visible, setDialogVisible] = useState<DialogVisible>(DialogVisible.Off)
  const [editWebhook, setEditWebhook] = useState<Webhook | null>(null)

  useEffect(() => {
    if (applicationId) {
      dispatcher.fetchApplicationWebhooks({ appId: applicationId })
    } else {
      dispatcher.fetchCurrentProjectWebhooks()
    }
    return dispatcher.reset
  }, [applicationId, dispatcher])

  const handleCloseDialog = useCallback(() => {
    setDialogVisible(DialogVisible.Off)
    setEditWebhook(null)
  }, [])

  const handleClickCreate = useCallback(() => {
    setDialogVisible(DialogVisible.Edit)
    setEditWebhook(null)
  }, [])

  const handleSubmitCreate = useCallback(
    (webhook: WebhookSchema) => {
      if (applicationId) {
        dispatcher.createWebhookForApplication({ appId: applicationId, input: webhook })
      } else {
        dispatcher.createWebhookForCurrentProject(webhook)
      }
      setDialogVisible(DialogVisible.Off)
    },
    [applicationId, dispatcher],
  )

  const handleSubmitEdit = useCallback(
    (webhook: WebhookSchema) => {
      dispatcher.updateWebhook({ webhookId: editWebhook!.id, input: webhook })
      setDialogVisible(DialogVisible.Off)
      setEditWebhook(null)
    },
    [dispatcher, editWebhook],
  )

  const handleRemoveWebhook = useCallback(
    (webhook: Webhook) => {
      dispatcher.deleteWebhook({ webhookId: webhook.id })
    },
    [dispatcher],
  )

  const handleEditWebhook = useCallback((webhook: Webhook) => {
    setEditWebhook(webhook)
    setDialogVisible(DialogVisible.Edit)
  }, [])

  const dialog = useMemo(() => {
    const isCreate = !editWebhook
    return (
      <SettingDialogs
        type="Webhook"
        editContent={
          <WebhookEditForm
            closeModal={handleCloseDialog}
            webhook={isCreate ? {} : pick(editWebhook, 'eventType', 'method', 'secret', 'url')}
            isCreate={isCreate}
            onSubmit={isCreate ? handleSubmitCreate : handleSubmitEdit}
          />
        }
        deleteContent={<></>}
        visible={visible}
        isCreate={isCreate}
        onCloseDialog={handleCloseDialog}
      />
    )
  }, [editWebhook, handleCloseDialog, handleSubmitCreate, handleSubmitEdit, visible])

  const webhooksContent = useMemo(() => {
    return loading ? (
      <Stack tokens={{ childrenGap: 16 }}>
        <Shimmer />
        <Shimmer />
        <Shimmer />
        <Shimmer />
      </Stack>
    ) : webhooks.length === 0 ? (
      <Empty withIcon={true} title="No webhook" />
    ) : (
      <WebhooksTable>
        {webhooks.map((webhook, index) => (
          <WebhookItem
            webhook={webhook}
            key={index}
            onClickEdit={handleEditWebhook}
            onClickRemove={handleRemoveWebhook}
          />
        ))}
      </WebhooksTable>
    )
  }, [handleEditWebhook, handleRemoveWebhook, loading, webhooks])

  return (
    <>
      <Stack tokens={{ childrenGap: 16 }}>
        <Stack horizontal horizontalAlign="space-between">
          <h2>Webhooks</h2>
          <PrimaryButton text="Create" iconProps={{ iconName: 'plus' }} onClick={handleClickCreate} />
        </Stack>
        <WebhooksDescription>
          Webhooks allow external services to be notified when certain events happen. When the specified events happen,
          we'll send a POST request to each of the URLs you provide. Learn more in our{' '}
          <ForeignLink href={staticPath.docs.settings.webhook}>Webhook Guide</ForeignLink>
        </WebhooksDescription>
      </Stack>
      {webhooksContent}
      {dialog}
    </>
  )
}

const WebhookItem = ({
  webhook,
  onClickEdit,
  onClickRemove,
}: {
  webhook: Webhook
  onClickEdit: (w: Webhook) => void
  onClickRemove: (w: Webhook) => void
}) => {
  const theme = useTheme()

  const handleClickRemove = useCallback(() => {
    onClickRemove(webhook)
  }, [onClickRemove, webhook])

  const handleClickEdit = useCallback(() => {
    onClickEdit(webhook)
  }, [onClickEdit, webhook])

  const lastDeliveryTime = webhook.lastDelivery
    ? Date.parse(webhook.lastDelivery.endTime) - Date.parse(webhook.lastDelivery.startTime)
    : null

  const mark = webhook.lastDelivery
    ? webhook.lastDelivery.isSuccess
      ? {
          icon: 'completed',
          color: theme.colors.success,
          message: `Last delivery was successful in ${lastDeliveryTime}ms. Status Code: ${webhook.lastDelivery.statusCode}.`,
        }
      : {
          icon: 'errorBadge',
          color: theme.colors.error,
          message: `Last delivery was not successful in ${lastDeliveryTime}ms. Status Code: ${webhook.lastDelivery.statusCode}.`,
        }
    : { icon: 'dot', color: theme.colors.disabled, message: 'This hook has never been triggered' }

  return (
    <WebhooksTableItem>
      <Stack horizontal horizontalAlign="space-between">
        <Stack horizontal tokens={{ childrenGap: 8 }}>
          <TooltipHost content={mark.message}>
            <Icon iconName={mark.icon} styles={{ root: { color: mark.color } }} />
          </TooltipHost>
          <span>{webhook.url}</span>
        </Stack>
        <Stack horizontal>
          <WebhookEditAction onClick={handleClickEdit}>Edit</WebhookEditAction>&nbsp;|&nbsp;
          <WebhookRemoveAction onClick={handleClickRemove}>Remove</WebhookRemoveAction>
        </Stack>
      </Stack>
    </WebhooksTableItem>
  )
}
