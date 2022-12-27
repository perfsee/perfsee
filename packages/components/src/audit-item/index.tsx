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

import { Stack } from '@fluentui/react'
import { ReactNode } from 'react'

import { StyledAuditItem, StyledItemContent, StyledAuditAdorn, StyledAuditDesc } from './style'

type Props = {
  title: string
  icon: ReactNode
  score?: number | string
  labels?: string[]
  description?: ReactNode
  children?: ReactNode
}

export const AuditItem = (props: Props) => {
  const { title, icon, score, labels = [], description, children } = props

  return (
    <StyledAuditItem>
      <Stack tokens={{ childrenGap: 12 }} horizontal verticalAlign="center">
        {icon}
        <b>{title}</b>
        {score !== undefined && <StyledAuditAdorn>{score}</StyledAuditAdorn>}
        {labels.map((key) => (
          <StyledAuditAdorn key={key}>{key}</StyledAuditAdorn>
        ))}
      </Stack>
      <StyledItemContent>
        <StyledAuditDesc>{description}</StyledAuditDesc>
        {children}
      </StyledItemContent>
    </StyledAuditItem>
  )
}
