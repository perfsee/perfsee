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
  ApiOutlined,
  BlockOutlined,
  DeleteOutlined,
  DesktopOutlined,
  EditOutlined,
  GlobalOutlined,
  RollbackOutlined,
  StopOutlined,
} from '@ant-design/icons'
import {
  DefaultButton,
  Dialog,
  DialogFooter,
  DialogType,
  PrimaryButton,
  Spinner,
  SpinnerSize,
  Stack,
  TooltipHost,
} from '@fluentui/react'
import { useCallback, FC, memo } from 'react'

import { ColorButton, TooltipWithEllipsis } from '@perfsee/components'
import { SharedColors } from '@perfsee/dls'

import { DeleteProgress } from '../../shared'

import { ButtonWrapper, WarningText, StyledDesc, OperationItemWrap, PagePropertyWrap, PagePropertyIcon } from './style'

export enum DialogVisible {
  Off = 0,
  Edit,
  Delete,
  Ping,
  Import,
}

type Props = {
  type: string // for dialog title
  visible: DialogVisible
  onCloseDialog: () => void
  editContent: JSX.Element
  deleteContent: JSX.Element
  pingContent?: JSX.Element
  isCreate?: boolean
}

export const SettingDialogs = memo((props: Props) => {
  const { type, editContent, deleteContent, pingContent, visible, onCloseDialog, isCreate } = props

  const contentProps = {
    type: DialogType.normal,
    title: (
      <Stack styles={{ root: { height: '30px' } }} horizontal horizontalAlign="space-between" verticalAlign="center">
        {`${
          visible === DialogVisible.Import
            ? 'Import'
            : visible === DialogVisible.Delete
            ? 'Delete'
            : visible === DialogVisible.Ping
            ? 'Ping'
            : isCreate
            ? 'Create'
            : 'Edit'
        } ${type}`}
      </Stack>
    ),
  }

  return (
    <>
      <Dialog
        minWidth="700px"
        hidden={visible === DialogVisible.Off}
        onDismiss={onCloseDialog}
        dialogContentProps={contentProps}
        modalProps={{ isBlocking: true }}
      >
        {visible === DialogVisible.Import || visible === DialogVisible.Edit ? (
          editContent
        ) : visible === DialogVisible.Delete ? (
          deleteContent
        ) : visible === DialogVisible.Ping ? (
          pingContent
        ) : (
          <Spinner />
        )}
      </Dialog>
    </>
  )
})

type ButtonProps<T> = {
  item: T
  showDisableButton?: boolean
  showRestoreButton?: boolean
  hideDeleteButton?: boolean
  clickEditButton: (item: T) => void
  clickDeleteButton: (item: T) => void
  clickPingButton?: (item: T) => void
  clickRestoreButton?: (item: T) => void
  clickDisableButton?: (item: T) => void
}

export const ButtonOperators = <T extends any>(props: ButtonProps<T>) => {
  const {
    item,
    hideDeleteButton,
    clickEditButton,
    clickPingButton,
    clickDeleteButton,
    clickDisableButton,
    clickRestoreButton,
    showDisableButton,
    showRestoreButton,
  } = props

  const onClickDisableButton = useCallback(() => {
    typeof clickDisableButton === 'function' && clickDisableButton(item)
  }, [item, clickDisableButton])

  const onClickPingButton = useCallback(() => {
    typeof clickPingButton === 'function' && clickPingButton(item)
  }, [item, clickPingButton])

  const onClickRestoreButton = useCallback(() => {
    typeof clickRestoreButton === 'function' && clickRestoreButton(item)
  }, [item, clickRestoreButton])

  const onClickEditButton = useCallback(() => {
    clickEditButton(item)
  }, [item, clickEditButton])

  const onClickDeleteButton = useCallback(() => {
    clickDeleteButton(item)
  }, [item, clickDeleteButton])

  return (
    <ButtonWrapper>
      <OperationItemWrap onClick={onClickEditButton}>
        <div>
          <EditOutlined />
        </div>
        <span>Edit</span>
      </OperationItemWrap>
      {clickPingButton && (
        <OperationItemWrap onClick={onClickPingButton}>
          <div>
            <ApiOutlined />
          </div>
          <span>Ping</span>
        </OperationItemWrap>
      )}
      {showDisableButton && (
        <OperationItemWrap onClick={onClickDisableButton}>
          <div>
            <StopOutlined />
          </div>
          <span>Disable</span>
        </OperationItemWrap>
      )}
      {showRestoreButton && (
        <OperationItemWrap color={SharedColors.cyanBlue10} onClick={onClickRestoreButton}>
          <div>
            <RollbackOutlined />
          </div>
          <span>Enable</span>
        </OperationItemWrap>
      )}
      {!hideDeleteButton && (
        <OperationItemWrap grow={0} color={SharedColors.red10} onClick={onClickDeleteButton}>
          <DeleteOutlined />
        </OperationItemWrap>
      )}
    </ButtonWrapper>
  )
}

type ContentProps = {
  name: string
  type: 'e2e test' | 'page' | 'profile' | 'env'
  progress: DeleteProgress
  onDelete: () => void
  closeModal: () => void
}

export const DeleteContent: FC<ContentProps> = (props) => {
  const { name, onDelete, closeModal, type, progress } = props
  const tips = `Snapshot Reports created using this ${type} will also be deleted.`

  if (progress === DeleteProgress.Running) {
    return <Spinner label={`Deleting ${type} ${name}, please wait...`} size={SpinnerSize.large} ariaLive="assertive" />
  }

  if (progress === DeleteProgress.Fail) {
    return (
      <>
        Failed to delete {type} <b>{name}</b>, please try again.
        <DialogFooter>
          <DefaultButton onClick={closeModal} text="OK" />
        </DialogFooter>
      </>
    )
  }

  if (progress === DeleteProgress.Done) {
    return (
      <>
        {type} <b>{name}</b> has been deleted.
        <DialogFooter>
          <DefaultButton onClick={closeModal} text="OK" />
        </DialogFooter>
      </>
    )
  }

  return (
    <>
      Are you sure delete <WarningText>{name}</WarningText> ? {tips}
      <DialogFooter>
        <ColorButton color={SharedColors.red10} onClick={onDelete} text="Delete" />
        <DefaultButton onClick={closeModal} text="Cancel" />
      </DialogFooter>
    </>
  )
}

type RightCreateButtonProps = {
  text: string
  tooltipContent?: string
  disabled?: boolean
  onClick: () => void
}

export const RightCreateButton: FC<RightCreateButtonProps> = (props) => {
  const { text, tooltipContent, disabled, onClick } = props
  return (
    <Stack horizontalAlign="end">
      <TooltipHost hidden={!disabled} content={tooltipContent}>
        <PrimaryButton disabled={disabled} onClick={onClick}>
          {text}
        </PrimaryButton>
      </TooltipHost>
    </Stack>
  )
}

type CountBlockProps = { count?: number; title: string }

export const CountBlock: FC<CountBlockProps> = ({ count, title }) => {
  if (!count) {
    return null
  }
  return (
    <StyledDesc size="12px">
      {count} {title}
      {count > 1 && 's'}
    </StyledDesc>
  )
}

export enum PagePropertyType {
  Profile,
  Environment,
  Competitor,
}

type PagePropertyProps = {
  type: PagePropertyType
  value: string
}

const PagePropertyIconMap = {
  [PagePropertyType.Profile]: {
    icon: <DesktopOutlined />,
    title: 'Profile',
  },
  [PagePropertyType.Environment]: {
    icon: <GlobalOutlined />,
    title: 'Environment',
  },
  [PagePropertyType.Competitor]: {
    icon: <BlockOutlined />,
    title: 'Competitor',
  },
}

export const PagePropertyItem: FC<PagePropertyProps> = memo(({ type, value }) => {
  const item = PagePropertyIconMap[type]

  if (!value) {
    return null
  }

  return (
    <PagePropertyWrap>
      <TooltipHost content={item.title}>
        <PagePropertyIcon>{item.icon}</PagePropertyIcon>
      </TooltipHost>
      <TooltipWithEllipsis content={value} />
    </PagePropertyWrap>
  )
})
