import { CheckCircleFilled } from '@ant-design/icons'
import styled from '@emotion/styled'
import { DefaultButton, PrimaryButton, SharedColors, Spinner, Stack } from '@fluentui/react'
import { useModule } from '@sigi/react'
import { useCallback, useEffect, useState } from 'react'

import { Card, ContentCard, useToggleState } from '@perfsee/components'

import { UsagePackForm } from './form'
import { UsagePack, UsagePackModule } from './module'

export function UsagePacks() {
  const [{ packs, loading }, dispatcher] = useModule(UsagePackModule)
  const [isFormOpen, openForm, closeForm] = useToggleState(false)
  const [editingPack, setEditingPack] = useState<UsagePack | undefined>()

  useEffect(() => {
    dispatcher.fetchUsagePacks()
  }, [dispatcher])

  const setDefaultPack = useCallback(
    (pack: UsagePack) => {
      dispatcher.setDefaultPack(pack.id)
    },
    [dispatcher],
  )

  const editPack = useCallback(
    (pack: UsagePack) => {
      setEditingPack(pack)
      openForm()
    },
    [openForm],
  )

  useEffect(() => {
    if (isFormOpen) {
      return () => setEditingPack(undefined)
    }
  }, [isFormOpen])

  if (loading) {
    return (
      <ContentCard>
        <Spinner label="loading" />
      </ContentCard>
    )
  }

  return (
    <ContentCard>
      <Stack tokens={{ childrenGap: 10 }}>
        <Stack.Item grow={false}>
          <PrimaryButton onClick={openForm}>Create Usage Pack</PrimaryButton>
        </Stack.Item>
        <Stack.Item>
          {packs.length === 0 ? (
            <p>No usage packs yet.</p>
          ) : (
            <Stack wrap={true} horizontal={true} tokens={{ childrenGap: 10 }}>
              {packs.map((pack) => (
                <Stack.Item key={pack.id} basis="310px">
                  <UsagePackItem item={pack} onSetDefault={setDefaultPack} onEdit={editPack} />
                </Stack.Item>
              ))}
            </Stack>
          )}
        </Stack.Item>
      </Stack>
      {isFormOpen && <UsagePackForm editing={editingPack} onClose={closeForm} />}
    </ContentCard>
  )
}

const Label = styled.span(({ theme }) => ({
  color: theme.text.colorSecondary,
}))

const Value = styled.span({
  fontWeight: 'bold',
  fontSize: '16px',
})

const DefaultLabel = styled.p<{ isDefault: boolean }>(({ isDefault, theme }) => ({
  float: 'right',
  color: theme.colors.success,
  opacity: isDefault ? 1 : 0,
  transition: 'opacity .3s ease-in-out',
  cursor: isDefault ? 'auto' : 'pointer',
}))

const HoverableCard = styled(Card)({
  height: '100%',
  p: {
    wordBreak: 'break-all',
  },
  [`&:hover ${DefaultLabel}`]: {
    opacity: 1,
  },
})

function UsagePackItem({
  item,
  onSetDefault,
  onEdit,
}: {
  item: UsagePack
  onSetDefault: (item: UsagePack) => void
  onEdit: (item: UsagePack) => void
}) {
  const onSetDefaultPack = useCallback(() => {
    onSetDefault(item)
  }, [item, onSetDefault])
  const onEditPack = useCallback(() => {
    onEdit(item)
  }, [item, onEdit])

  return (
    <HoverableCard>
      {item.isDefault ? (
        <DefaultLabel isDefault={true}>
          <Value>
            <CheckCircleFilled /> {'  '}
            Default
          </Value>
        </DefaultLabel>
      ) : (
        <DefaultLabel isDefault={false} onClick={onSetDefaultPack}>
          <Value>
            <CheckCircleFilled /> {'  '}
            Set Default
          </Value>
        </DefaultLabel>
      )}
      <p>
        <Label>ID: </Label>
        <Value>{item.id}</Value>
      </p>
      <p>
        <Label>Display Name: </Label>
        <Value>{item.name}</Value>
      </p>
      <p>
        <Label>Desc: </Label>
        <Value>{item.desc}</Value>
      </p>
      <p>
        <Label>Job Count: </Label>
        <Value>{item.jobCountMonthly / 1000}k</Value> per month
      </p>
      <p>
        <Label>Job Time: </Label>
        <Value>{item.jobDurationMonthly}mins</Value> per month
      </p>
      <p>
        <Label>Storage: </Label>
        <Value>{item.storage}MB</Value> total
      </p>
      <p>
        <Label>Public: </Label>
        <Value style={{ color: item.isPublic ? SharedColors.green20 : SharedColors.red20 }}>
          {item.isPublic ? 'true' : 'false'}
        </Value>
      </p>
      <DefaultButton styles={{ root: { width: '100%', marginTop: '8px' } }} onClick={onEditPack}>
        Edit
      </DefaultButton>
    </HoverableCard>
  )
}
