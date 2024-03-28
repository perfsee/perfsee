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
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  CloseOutlined,
  LoadingOutlined,
  StarOutlined,
} from '@ant-design/icons'
import { Theme } from '@emotion/react'
import styled from '@emotion/styled'
import { FC, ComponentType } from 'react'

import { Tag } from '@perfsee/components'
import { JobStatus } from '@perfsee/schema'

const statusIconMap: Record<JobStatus | 'Picked', ComponentType> = {
  [JobStatus.Done]: CheckCircleOutlined,
  [JobStatus.Pending]: ClockCircleOutlined,
  [JobStatus.Running]: LoadingOutlined,
  [JobStatus.Failed]: CloseOutlined,
  [JobStatus.Canceled]: CloseCircleOutlined,
  Picked: StarOutlined,
}

const tagTypeMap: { [key in JobStatus | 'Picked']: keyof Theme['tag'] } = {
  [JobStatus.Done]: 'success',
  [JobStatus.Pending]: 'warning',
  [JobStatus.Running]: 'info',
  [JobStatus.Failed]: 'error',
  [JobStatus.Canceled]: 'error',
  Picked: 'success',
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

export const JobStatusTag: FC<{ status: JobStatus | 'Picked' }> = ({ status }) => {
  const Icon = statusIconMap[status]
  return (
    <StatusTag type={tagTypeMap[status]}>
      <Icon />
      {status}
    </StatusTag>
  )
}
