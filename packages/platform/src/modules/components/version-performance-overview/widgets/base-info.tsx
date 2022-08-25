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

import { BranchesOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { FC } from 'react'

import { pathFactory } from '@perfsee/shared/routes'

import { useGenerateProjectRoute } from '../../../shared'

import { LatestVersionInfo, InfoKeySpan, VersionTag, InfoDivider, InfoValueSpan, StyledLink } from './styled'

type Props = {
  reportId: number
  hash: string
  snapshotCreatedAt: string
  artifact?: {
    branch: string
    hash: string
  } | null
}

export const BaseInfo: FC<Props> = (props) => {
  const { reportId, hash, snapshotCreatedAt, artifact } = props
  const generateProjectRoute = useGenerateProjectRoute()

  const versionReportLink = generateProjectRoute(pathFactory.project.report, {}, { reportId, hash })

  return (
    <LatestVersionInfo>
      <InfoKeySpan>Commit</InfoKeySpan>
      <VersionTag>{hash.slice(0, 8)}</VersionTag>
      <InfoDivider />
      <InfoKeySpan>Date</InfoKeySpan>
      <InfoValueSpan>{dayjs(snapshotCreatedAt).format('YYYY/MM/DD HH:mm:ss')}</InfoValueSpan>
      {artifact && (
        <>
          <InfoDivider />
          <BranchesOutlined />
          <InfoValueSpan>{artifact.branch}</InfoValueSpan>
        </>
      )}
      <InfoDivider />
      <StyledLink to={versionReportLink}>Complete Version Report</StyledLink>
    </LatestVersionInfo>
  )
}
