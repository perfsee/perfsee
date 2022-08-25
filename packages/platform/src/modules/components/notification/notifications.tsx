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

import { Stack, IStackTokens } from '@fluentui/react'
import { useEffect, useState, useCallback } from 'react'
import { useLocation } from 'react-router-dom'

import { Message, notificationSubject } from '@perfsee/platform/common'

import { Notice } from './notice'

const messageStackTokens: IStackTokens = {
  childrenGap: 8,
}

export const NotificationsInner = () => {
  const [messages, setMessages] = useState<Array<Message & { id: number }>>([])
  const location = useLocation()

  useEffect(() => {
    const sub = notificationSubject.subscribe((newMessage) => {
      setMessages((messages) => {
        return [...messages, { ...newMessage, id: Date.now() }]
      })
    })

    return () => {
      sub.unsubscribe()
    }
  }, [setMessages])

  useEffect(() => {
    setMessages([])
  }, [location.pathname, setMessages])

  const onDismiss = useCallback(
    (dismissedId: number) => {
      setMessages((messages) => {
        return messages.filter(({ id }) => dismissedId !== id)
      })
    },
    [setMessages],
  )

  if (!messages.length) {
    return null
  }

  return (
    <Stack tokens={messageStackTokens}>
      {messages.map((message) => {
        return (
          <Notice
            key={message.id}
            id={message.id}
            type={message.type}
            content={message.content}
            duration={message.duration}
            onDismiss={onDismiss}
          />
        )
      })}
    </Stack>
  )
}
