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

import { CloseOutlined, ExclamationCircleOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { DefaultButton, Modal as FluentModal, SharedColors, IModalStyles, IModalProps } from '@fluentui/react'
import { memo, useMemo, useCallback } from 'react'
import type { FC, ReactNode } from 'react'

import { ColorButton } from '../color-button'

import { CloseIconWrap, Container, Content, Footer, Header, Icon, Title } from './style'

export enum ModalType {
  Confirm,
  Warning,
}

export type ModalProps = IModalProps & {
  isOpen: boolean
  type?: ModalType
  title?: string
  children?: ReactNode
  showCloseIcon?: boolean
  confirmDisabled?: boolean
  onClose: () => void
  onConfirm?: () => void
}

const ModalColors: Record<ModalType, string> = {
  [ModalType.Confirm]: SharedColors.cyanBlue10,
  [ModalType.Warning]: SharedColors.red10,
}

const ModalIcons: Record<ModalType, ReactNode> = {
  [ModalType.Confirm]: <InfoCircleOutlined />,
  [ModalType.Warning]: <ExclamationCircleOutlined />,
}

export const Modal: FC<ModalProps> = memo((props) => {
  const {
    isOpen,
    title,
    children,
    showCloseIcon = true,
    type = ModalType.Confirm,
    confirmDisabled = false,
    onClose,
    onConfirm,
    styles,
    ...restProps
  } = props

  const primaryColor = ModalColors[type]

  const modalStyles = useMemo<Partial<IModalStyles>>(
    () => ({
      main: {
        minWidth: '400px',
      },
      ...styles,
    }),
    [styles],
  )

  const onClickConfirm = useCallback(() => {
    if (!confirmDisabled && onConfirm) {
      onConfirm()
    }
  }, [confirmDisabled, onConfirm])

  return (
    <FluentModal {...restProps} isOpen={isOpen} styles={modalStyles}>
      <Container>
        <Header>
          <Title>
            <Icon color={primaryColor}>{ModalIcons[type]}</Icon>
            <span>{title}</span>
          </Title>
          {showCloseIcon && (
            <CloseIconWrap onClick={onClose}>
              <CloseOutlined />
            </CloseIconWrap>
          )}
        </Header>
        <Content>{children}</Content>
        <Footer>
          <DefaultButton onClick={onClose}>Cancel</DefaultButton>
          <ColorButton color={primaryColor} disabled={confirmDisabled} onClick={onClickConfirm}>
            Confirm
          </ColorButton>
        </Footer>
      </Container>
    </FluentModal>
  )
})
