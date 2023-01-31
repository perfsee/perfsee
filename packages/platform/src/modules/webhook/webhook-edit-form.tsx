import {
  DefaultButton,
  DialogFooter,
  Dropdown,
  IDropdownOption,
  PrimaryButton,
  Stack,
  TextField,
} from '@fluentui/react'
import { useCallback, useState } from 'react'

import { URLTextField } from '@perfsee/components'

import { WebhookEventTypeEditor } from './webhook-event-type-editor'
import { WebhookSchema } from './webhook.module'

export interface Props {
  webhook: Partial<WebhookSchema>
  isCreate: boolean
  closeModal: () => void
  onSubmit: (payload: WebhookSchema) => void
}

export const WebhookEditForm = ({ webhook: defaultWebhook, isCreate, closeModal, onSubmit }: Props) => {
  const [webhook, setWebhook] = useState<WebhookSchema>({
    eventType: '*',
    method: 'POST',
    secret: null,
    url: '',
    ...defaultWebhook,
  })

  const handleUrlChange = useCallback((url?: string) => {
    setWebhook((prev) => ({ ...prev, url: url ?? '' }))
  }, [])

  const handleSecretChange = useCallback((_: any, value?: string) => {
    setWebhook((prev) => ({ ...prev, secret: value ?? null }))
  }, [])

  const handleMethodChange = useCallback((_: any, value?: IDropdownOption<any>) => {
    setWebhook((prev) => ({ ...prev, method: value?.key as string }))
  }, [])

  const handleEventTypeChange = useCallback((eventType: string) => setWebhook((prev) => ({ ...prev, eventType })), [])

  const handleSubmit = useCallback(() => {
    onSubmit(webhook)
  }, [onSubmit, webhook])

  return (
    <Stack tokens={{ childrenGap: 6 }}>
      <URLTextField required onChange={handleUrlChange} value={webhook.url} />
      <TextField label="Secret" maxLength={1024} onChange={handleSecretChange} value={webhook.secret ?? ''} />
      <Dropdown
        options={[
          {
            key: 'POST',
            text: 'POST',
          },
        ]}
        required={true}
        label="Method"
        onChange={handleMethodChange}
        defaultSelectedKey={webhook.method}
      />
      <WebhookEventTypeEditor onChange={handleEventTypeChange} value={webhook.eventType} />
      <DialogFooter>
        <PrimaryButton onClick={handleSubmit} text={isCreate ? 'Create' : 'Save'} />
        <DefaultButton onClick={closeModal} text="Cancel" />
      </DialogFooter>
    </Stack>
  )
}
