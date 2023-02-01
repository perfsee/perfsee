import styled from '@emotion/styled'
import { Checkbox, Label, Stack } from '@fluentui/react'
import { useCallback, useMemo } from 'react'

import { parseWebhookEventTypeWildcardExpr, WebhookEventType, WEBHOOK_EVENT_TYPE } from '@perfsee/shared'

interface Props {
  value: string
  onChange: (value: string) => void
}

const EventsContainer = styled.div(({ theme }) => ({
  border: `1px solid ${theme.text.color}`,
  borderRadius: theme.border.radius,
  maxHeight: '300px',
  overflowY: 'scroll',
  display: 'flex',
  flexWrap: 'wrap',
}))

const Event = styled.div({
  flex: '1 1 50%',
  padding: '16px 24px 24px',
  display: 'grid',
  grid: `
  "checkbox title" auto
  "gap description" 1fr / auto 1fr`,
  gap: '4px 8px',
})

const EventCheckbox = styled(Checkbox)({
  gridArea: 'checkbox',
})

const EventTitle = styled.span({
  fontWeight: 600,
  gridArea: 'title',
})

const EventDescription = styled.span({
  fontWeight: 400,
  gridArea: 'description',
})

export const WebhookEventTypeEditor = ({ value, onChange }: Props) => {
  const eventTypeExpr = useMemo(() => {
    return parseWebhookEventTypeWildcardExpr(value)
  }, [value])

  const handleSelectAll = useCallback(() => {
    onChange('*')
  }, [onChange])

  const handleUnselectAll = useCallback(() => {
    onChange('')
  }, [onChange])

  const handleChangeChecked = useCallback(
    (checked: WebhookEventType[]) => {
      if (checked.length === WEBHOOK_EVENT_TYPE.length) {
        handleSelectAll()
      } else {
        onChange(checked.map((e) => e.key).join(','))
      }
    },
    [handleSelectAll, onChange],
  )

  const checked = useMemo(() => {
    return WEBHOOK_EVENT_TYPE.filter((eventType) => eventTypeExpr.test(eventType.key))
  }, [eventTypeExpr])

  const handleEventTypeCheck = useMemo(() => {
    return WEBHOOK_EVENT_TYPE.map((eventType) => {
      return (_ev?: any, value?: boolean) => {
        if (value) {
          handleChangeChecked([...checked, eventType])
        } else {
          handleChangeChecked(checked.filter((e) => e !== eventType))
        }
      }
    })
  }, [checked, handleChangeChecked])

  const eventTypes = useMemo(() => {
    return WEBHOOK_EVENT_TYPE.map((eventType, i) => (
      <Event key={i}>
        <EventCheckbox checked={checked.includes(eventType)} onChange={handleEventTypeCheck[i]} />
        <EventTitle>{eventType.name}</EventTitle>
        <EventDescription>{eventType.description}</EventDescription>
      </Event>
    ))
  }, [checked, handleEventTypeCheck])

  const selectAll = checked.length === WEBHOOK_EVENT_TYPE.length

  return (
    <>
      <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
        <Label>Event type</Label>
        <Checkbox label="Select All" checked={selectAll} onChange={selectAll ? handleUnselectAll : handleSelectAll} />
      </Stack>
      <EventsContainer>{eventTypes}</EventsContainer>
    </>
  )
}
