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

import { NodeIndexOutlined, BranchesOutlined, PlusCircleOutlined, ClockCircleOutlined } from '@ant-design/icons'
import styled from '@emotion/styled'
import { Stack } from '@fluentui/react'
import dayjs from 'dayjs'
import { FC, memo } from 'react'
import { Link } from 'react-router-dom'

import { ForeignLink, Tag } from '@perfsee/components'
import { getCommitLink } from '@perfsee/shared'
import { pathFactory } from '@perfsee/shared/routes'

import { BundleCard, BuildRound, EmptyBaselineWrap, EmptyBaselineIcon } from './style'
import { ArtifactDiff } from './types'

export const CommitMessage = styled.span({
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
})

export const CommitInfoContainer = styled.div(({ theme }) => ({
  fontSize: 12,
  color: theme.text.colorSecondary,
  marginTop: 8,
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  overflow: 'hidden',
  '>*': {
    marginRight: 6,
  },
  'span[role=img] + span': { marginRight: 12 },
}))

interface Props {
  artifact: ArtifactDiff
  onBaselineSelectorOpen?: () => void
}
export const BuildHistory: FC<Props> = ({ artifact, onBaselineSelectorOpen }) => {
  const { baseline, project } = artifact
  return (
    <BundleCard>
      <Stack horizontal verticalAlign="center">
        <Stack.Item grow={1}>
          <BuildRound>#{artifact.id}</BuildRound>
          <Tag type="warning">current</Tag>
          <CommitInfo artifact={artifact} />
        </Stack.Item>

        {baseline && project ? (
          <Stack.Item grow={1}>
            <Link
              to={pathFactory.project.bundle.detail({
                projectId: project.id,
                bundleId: baseline.id,
              })}
            >
              <BuildRound>#{baseline.id}</BuildRound>
            </Link>
            <Tag type="default">baseline</Tag>
            <CommitInfo artifact={baseline} />
          </Stack.Item>
        ) : (
          onBaselineSelectorOpen && (
            <Stack.Item grow={1}>
              <EmptyBaselineWrap onClick={onBaselineSelectorOpen}>
                <EmptyBaselineIcon>
                  <PlusCircleOutlined />
                </EmptyBaselineIcon>
                <b>{baseline ? 'No match entrypoint in baseline' : 'No baseline'}</b>
                <p>Select another version to compare</p>
              </EmptyBaselineWrap>
            </Stack.Item>
          )
        )}
      </Stack>
    </BundleCard>
  )
}

export const CommitInfo = memo<{ artifact: ArtifactDiff }>(({ artifact }) => {
  const { project } = artifact

  if (!project) {
    return null
  }

  return (
    <CommitInfoContainer>
      <ClockCircleOutlined />
      <span>{dayjs(artifact.createdAt).fromNow()}</span>
      <BranchesOutlined />
      <span>{artifact.branch}</span>
      <NodeIndexOutlined />
      <ForeignLink href={getCommitLink(project, artifact.hash)}>{artifact.hash.substring(0, 8)}</ForeignLink>
      <CommitMessage>{artifact.version?.commitMessage}</CommitMessage>
    </CommitInfoContainer>
  )
})
