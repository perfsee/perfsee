import { Checkbox, Stack } from '@fluentui/react'
import { useModule } from '@sigi/react'
import { omit } from 'lodash'
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'

import { Modal, RequiredTextField } from '@perfsee/components'
import { CreateUsagePackInput, UpdateUsagePackInput } from '@perfsee/schema'

import { UsagePack, UsagePackModule } from './module'

interface Props {
  editing?: UsagePack
  onClose: () => void
}

export function UsagePackForm({ editing, onClose }: Props) {
  const [{ saving }, { update, create }] = useModule(UsagePackModule)
  const [changes, setChanges] = useState<Partial<CreateUsagePackInput & { id?: number }>>(
    editing ? { id: editing.id } : { isPublic: false },
  )

  const requiredFields = useMemo<Array<keyof CreateUsagePackInput>>(
    () => (editing ? [] : ['name', 'jobCountMonthly', 'jobDurationMonthly', 'storage', 'desc']),
    [editing],
  )

  const onFieldChange = useCallback((event?: FormEvent<any>, value?: string | boolean) => {
    if (!event) {
      return
    }

    const field = event.currentTarget.name
    const type = event.currentTarget.type
    if (typeof value === 'undefined') {
      return setChanges((changes) => {
        return omit(changes, field)
      })
    }

    setChanges((changes) => {
      return {
        ...changes,
        [field]: type === 'number' ? Number(value) : value,
      }
    })
  }, [])

  const onSubmit = useCallback(() => {
    if (changes.id) {
      if (Object.keys(changes).length > 1) {
        update(changes as UpdateUsagePackInput)
      }
    } else {
      create(changes as CreateUsagePackInput)
    }
  }, [changes, update, create])

  useEffect(() => {
    if (saving) {
      return onClose
    }
  }, [saving, onClose])

  const confirmDisabled = editing
    ? Object.keys(changes).length === 1
    : requiredFields.some((field) => typeof changes[field] === 'undefined')

  return (
    <Modal
      isOpen={true}
      title={editing ? `Edit Usage Pack ${editing.id}` : 'Create Usage Pack'}
      onClose={onClose}
      onConfirm={onSubmit}
      confirmDisabled={saving || confirmDisabled}
    >
      <Stack tokens={{ padding: 16, childrenGap: 8 }}>
        <RequiredTextField name="name" label="Name" defaultValue={editing?.name} onChange={onFieldChange} />
        <RequiredTextField
          type="number"
          name="jobCountMonthly"
          label="Job count monthly"
          // @ts-expect-error number to string
          defaultValue={editing?.jobCountMonthly}
          onChange={onFieldChange}
        />
        <RequiredTextField
          type="number"
          name="jobDurationMonthly"
          label="Job duration monthly"
          // @ts-expect-error number to string
          defaultValue={editing?.jobDurationMonthly}
          onChange={onFieldChange}
        />
        <RequiredTextField
          type="number"
          name="storage"
          label="Storage"
          // @ts-expect-error number to string
          defaultValue={editing?.storage}
          onChange={onFieldChange}
        />
        <RequiredTextField name="desc" label="Desc" defaultValue={editing?.desc} onChange={onFieldChange} />
        <Checkbox
          name="isPublic"
          label={changes.isPublic ?? editing?.isPublic ? 'Public' : 'Private'}
          defaultChecked={editing?.isPublic}
          onChange={onFieldChange}
        />
      </Stack>
    </Modal>
  )
}
