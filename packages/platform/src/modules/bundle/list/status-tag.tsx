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

import { ClockCircleOutlined, LoadingOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { PropsOf, Theme } from '@emotion/react'
import styled from '@emotion/styled'
import { ComponentType, FC } from 'react'

import { ForeignLink, Tag } from '@perfsee/components'
import { BundleJobStatus } from '@perfsee/schema'

const iconMap: { [key in BundleJobStatus]: ComponentType<any> } = {
  [BundleJobStatus.Passed]: CheckCircleOutlined,
  [BundleJobStatus.Failed]: CloseCircleOutlined,
  [BundleJobStatus.Pending]: ClockCircleOutlined,
  [BundleJobStatus.Running]: LoadingOutlined,
}

const tagTypeMap: { [key in BundleJobStatus]: keyof Theme['tag'] } = {
  [BundleJobStatus.Passed]: 'success',
  [BundleJobStatus.Failed]: 'error',
  [BundleJobStatus.Running]: 'info',
  [BundleJobStatus.Pending]: 'warning',
}

const StatusTag = styled(Tag)({
  borderRadius: '4px',
  fontSize: '12px',
  height: '24px',
  '> span:first-of-type': {
    marginRight: '8px',
  },
})

const Wrapper = styled(ForeignLink)({
  ':-webkit-any-link': {
    color: 'inherit',
  },
  ':hover': {
    textDecoration: 'none',
  },
})

export const BundleStatusTag: FC<PropsOf<typeof ForeignLink> & { status: BundleJobStatus }> = ({
  status,
  ...props
}) => {
  const Icon = iconMap[status]
  return (
    <Wrapper {...props}>
      <StatusTag type={tagTypeMap[status]}>
        <Icon />
        {status}
      </StatusTag>
    </Wrapper>
  )
}
