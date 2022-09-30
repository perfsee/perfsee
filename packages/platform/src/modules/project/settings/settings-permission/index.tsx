import { useModule } from '@sigi/react'
import { useCallback, useEffect } from 'react'

import { UserEmailsInput } from '@perfsee/platform/modules/components'
import { Permission } from '@perfsee/schema'

import { PermissionSettingsModule } from './module'

export function SettingsPermission() {
  const [{ owners, viewers }, dispatcher] = useModule(PermissionSettingsModule, {
    selector: (state) => ({
      owners: state.owners.map(({ email }) => email),
      viewers: state.viewers.map(({ email }) => email),
    }),
    dependencies: [],
  })

  const onAddOwner = useCallback(
    (email: string) => {
      dispatcher.saveProjectOwners({ email, permission: Permission.Admin, isAdd: true })
    },
    [dispatcher],
  )

  const onAddViewer = useCallback(
    (email: string) => {
      dispatcher.saveProjectOwners({ email, permission: Permission.Read, isAdd: true })
    },
    [dispatcher],
  )

  const onDeleteOwner = useCallback(
    (email: string) => {
      dispatcher.saveProjectOwners({ email, permission: Permission.Admin, isAdd: false })
    },
    [dispatcher],
  )

  const onDeleteViewer = useCallback(
    (email: string) => {
      dispatcher.saveProjectOwners({ email, permission: Permission.Read, isAdd: false })
    },
    [dispatcher],
  )

  useEffect(() => {
    dispatcher.getProjectAuthorizedUsers()
  }, [dispatcher])

  return (
    <div>
      <UserEmailsInput required label="Owners" emails={owners} onAdd={onAddOwner} onDelete={onDeleteOwner} />

      <UserEmailsInput label="Viewers" emails={viewers} onAdd={onAddViewer} onDelete={onDeleteViewer} />
    </div>
  )
}
