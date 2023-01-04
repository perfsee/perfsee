import {
  ChoiceGroup,
  IChoiceGroupOption,
  Persona,
  PersonaSize,
  PrimaryButton,
  SelectionMode,
  Stack,
  TextField,
} from '@fluentui/react'
import { useModule } from '@sigi/react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { Modal, PopConfirm, Table, TableColumnProps, useToggleState } from '@perfsee/components'
import { Permission } from '@perfsee/schema'

import { PermissionSettingsModule, User } from './module'
import { ModalContent, OperationSpan } from './styled'

const choiceGroupStyle = {
  root: {
    marginTop: '12px',
  },
  flexContainer: {
    display: 'flex',

    div: {
      marginTop: 0,
      marginRight: '10px',
    },
  },
}

export function SettingsPermission() {
  const [{ users }, dispatcher] = useModule(PermissionSettingsModule, {
    selector: (state) => ({
      users: state.users,
    }),
    dependencies: [],
  })

  const onAddUser = useCallback(
    (newUserEmail: string, newPermission: Permission) => {
      dispatcher.saveProjectOwners({ email: newUserEmail, permission: newPermission, isAdd: true })
    },
    [dispatcher],
  )

  const onDeleteUser = useCallback(
    (user: User) => () => {
      dispatcher.saveProjectOwners({ email: user.email, permission: user.permission, isAdd: false })
    },
    [dispatcher],
  )

  useEffect(() => {
    dispatcher.getProjectAuthorizedUsers()
  }, [dispatcher])

  return <DumbSettingPermission users={users} onAddUser={onAddUser} onDeleteUser={onDeleteUser} />
}

export type SettingPermissionProps = {
  users: User[]
  onAddUser: (email: string, newPermission: Permission) => void
  onDeleteUser: (user: User) => void
}

export function DumbSettingPermission({ onAddUser, onDeleteUser, users }: SettingPermissionProps) {
  const [modalVisible, showModal, hideModal] = useToggleState(false)
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserPermission, setNewUserPermission] = useState(Permission.Read)

  const onChangeNewEmail = useCallback((_: any, value?: string) => {
    setNewUserEmail(value ?? '')
  }, [])

  const onChangeNewPermission = useCallback((_: any, option?: IChoiceGroupOption) => {
    const permission = (option?.key as Permission) ?? Permission.Read
    setNewUserPermission(permission)
  }, [])

  const onCloseModal = useCallback(() => {
    hideModal()

    setNewUserEmail('')
    setNewUserPermission(Permission.Read)
  }, [hideModal])

  const onAdd = useCallback(() => {
    onAddUser(newUserEmail, newUserPermission)
    onCloseModal()
  }, [newUserEmail, newUserPermission, onCloseModal, onAddUser])

  const onDelete = useCallback((user: User) => () => onDeleteUser(user), [onDeleteUser])

  const columns = useMemo<TableColumnProps<User>[]>(
    () => [
      {
        key: 'avatar',
        name: '',
        minWidth: 24,
        maxWidth: 24,
        onRender: (item) => (
          <Persona size={PersonaSize.size24} text={item.email} imageUrl={item.avatarUrl ?? undefined} />
        ),
      },
      {
        key: 'email',
        name: 'Email',
        minWidth: 200,
        maxWidth: 200,
        onRender: (item) => item.email,
      },
      {
        key: 'username',
        name: 'Username',
        minWidth: 150,
        maxWidth: 150,
        onRender: (item) => item.username,
      },

      {
        key: 'permission',
        name: 'Permission',
        minWidth: 80,
        maxWidth: 100,
        onRender: (item) => item.permission,
      },
      {
        key: 'operation',
        name: 'Operations',
        minWidth: 200,
        onRender: (item) => {
          return (
            <Stack horizontal>
              <PopConfirm title="Confirm remove this user?" onConfirm={onDelete(item)}>
                <OperationSpan>remove</OperationSpan>
              </PopConfirm>
            </Stack>
          )
        },
      },
    ],
    [onDelete],
  )

  const permissionGroup = useMemo<IChoiceGroupOption[]>(
    () => [
      { key: Permission.Admin, text: 'Admin' },
      { key: Permission.Read, text: 'Read' },
    ],
    [],
  )

  return (
    <div>
      <PrimaryButton iconProps={{ iconName: 'plus' }} onClick={showModal}>
        Add User
      </PrimaryButton>
      <Table columns={columns} items={users} selectionMode={SelectionMode.none} />

      <Modal title="Add user" isOpen={modalVisible} onClose={onCloseModal} onConfirm={onAdd}>
        <ModalContent>
          <TextField label="User email" type="text" onChange={onChangeNewEmail} required />
          <ChoiceGroup
            defaultSelectedKey={Permission.Read}
            options={permissionGroup}
            onChange={onChangeNewPermission}
            label="Permission"
            required={true}
            styles={choiceGroupStyle}
          />
        </ModalContent>
      </Modal>
    </div>
  )
}
