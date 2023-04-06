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

import { CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, LoadingOutlined } from '@ant-design/icons'
import { Theme } from '@emotion/react'
import styled from '@emotion/styled'
import { FC, ComponentType } from 'react'

import { Tag } from '@perfsee/components'
import { SourceStatus } from '@perfsee/schema'

const statusIconMap: Record<SourceStatus, ComponentType> = {
  [SourceStatus.Completed]: CheckCircleOutlined,
  [SourceStatus.Pending]: ClockCircleOutlined,
  [SourceStatus.Running]: LoadingOutlined,
  [SourceStatus.Failed]: CloseCircleOutlined,
}

const tagTypeMap: { [key in SourceStatus]: keyof Theme['tag'] } = {
  [SourceStatus.Completed]: 'success',
  [SourceStatus.Pending]: 'warning',
  [SourceStatus.Running]: 'info',
  [SourceStatus.Failed]: 'error',
}

const StatusTag = styled(Tag)({
  display: 'flex',
  alignItems: 'center',
  borderRadius: '4px',
  fontSize: '12px',
  height: '24px',
  '> span:first-of-type': {
    marginRight: '8px',
  },
})

export const SourceStatusTag: FC<{ status: SourceStatus }> = ({ status }) => {
  const Icon = statusIconMap[status]
  return (
    <StatusTag type={tagTypeMap[status]}>
      <Icon />
      {status}
    </StatusTag>
  )
}
