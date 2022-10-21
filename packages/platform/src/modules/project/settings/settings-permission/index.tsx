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

  const [modalVisible, showModal, hideModal] = useToggleState(false)
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserPermission, setNewUserPermission] = useState(Permission.Read)

  const onCloseModal = useCallback(() => {
    hideModal()

    setNewUserEmail('')
    setNewUserPermission(Permission.Read)
  }, [hideModal])

  const onAddUser = useCallback(() => {
    dispatcher.saveProjectOwners({ email: newUserEmail, permission: newUserPermission, isAdd: true })

    onCloseModal()
  }, [dispatcher, newUserEmail, newUserPermission, onCloseModal])

  const onDelete = useCallback(
    (user: User) => () => {
      dispatcher.saveProjectOwners({ email: user.email, permission: user.permission, isAdd: false })
    },
    [dispatcher],
  )

  const onChangeNewEmail = useCallback((_: any, value?: string) => {
    setNewUserEmail(value ?? '')
  }, [])

  const onChangeNewPermission = useCallback((_: any, option?: IChoiceGroupOption) => {
    const permission = (option?.key as Permission) ?? Permission.Read
    setNewUserPermission(permission)
  }, [])

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

  useEffect(() => {
    dispatcher.getProjectAuthorizedUsers()
  }, [dispatcher])

  return (
    <div>
      <PrimaryButton iconProps={{ iconName: 'plus' }} onClick={showModal}>
        Add User
      </PrimaryButton>
      <Table columns={columns} items={users} selectionMode={SelectionMode.none} />

      <Modal title="Add user" isOpen={modalVisible} onClose={onCloseModal} onConfirm={onAddUser}>
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
