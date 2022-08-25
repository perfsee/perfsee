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
  CheckCircleFilled,
  InfoCircleFilled,
  ExclamationCircleFilled,
  CloseCircleFilled,
  CloseOutlined,
} from '@ant-design/icons'
import { useTheme } from '@emotion/react'
import { FC, memo, useCallback, useEffect } from 'react'

import { Message, NoticeType } from '@perfsee/platform/common'

import { CloseButtonWrap, ContentWrap, IconWrap, NoticeTitle, NoticeWrap } from './styled'

type Props = Message & {
  id: number
  onDismiss: (id: number) => void
}

type ConfigItem = {
  icon: JSX.Element
  title: string
  color: string
}

export const Notice: FC<Props> = memo((props) => {
  const theme = useTheme()

  const { id, duration, content, type, title, onDismiss } = props

  const onClose = useCallback(() => {
    onDismiss(id)
  }, [id, onDismiss])

  useEffect(() => {
    if (duration) {
      const timeout = setTimeout(() => {
        onClose()
      }, duration)

      return () => {
        clearTimeout(timeout)
      }
    }
  }, [onClose, duration])

  const configs: Record<NoticeType, ConfigItem> = {
    [NoticeType.Info]: {
      icon: <InfoCircleFilled />,
      title: 'Notification',
      color: theme.text.colorSecondary,
    },
    [NoticeType.Error]: {
      icon: <CloseCircleFilled />,
      title: 'Error',
      color: theme.colors.error,
    },
    [NoticeType.Success]: {
      icon: <CheckCircleFilled />,
      title: 'Success',
      color: theme.colors.success,
    },
    [NoticeType.Warning]: {
      icon: <ExclamationCircleFilled />,
      title: 'Warning',
      color: theme.colors.warning,
    },
  }

  const { icon, title: defaultTitle, color } = configs[type]

  return (
    <NoticeWrap>
      <IconWrap color={color}>{icon}</IconWrap>
      <ContentWrap>
        <NoticeTitle>{title ?? defaultTitle}</NoticeTitle>
        <div>{content}</div>
      </ContentWrap>
      {/* fluentUI modal & dialog will block [click] event by default */}
      <CloseButtonWrap onMouseUp={onClose}>
        <CloseOutlined />
      </CloseButtonWrap>
    </NoticeWrap>
  )
})
