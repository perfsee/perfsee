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
import { FC, memo, useContext } from 'react'

import { ForeignLink, Tag } from '@perfsee/components'
import { getCommitLink } from '@perfsee/shared'
import { pathFactory } from '@perfsee/shared/routes'

import { RouterContext } from '../router-context'

import { BundleCard, BuildRound, EmptyBaselineWrap, EmptyBaselineIcon, ArtifactName } from './style'
import { ArtifactDiff } from './types'

const CommitMessage = styled.span({
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
})

const CommitInfoContainer = styled.div(({ theme }) => ({
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

const BuildHistoryItem = styled.div({
  overflow: 'hidden',
  flexShrink: 1,
  flexGrow: '1',
  flexBasis: '100%',
})

const BuildHistoryContainer = styled(Stack)({
  gap: '8px',
  '@media(max-width: 960px)': {
    flexWrap: 'wrap',
    gap: '32px',
  },
})

interface Props {
  artifact: ArtifactDiff
  onBaselineSelectorOpen?: () => void
}
export const BuildHistory: FC<Props> = ({ artifact, onBaselineSelectorOpen }) => {
  const { baseline, project } = artifact
  const { Link } = useContext(RouterContext)
  return (
    <BundleCard>
      <BuildHistoryContainer horizontal verticalAlign="center">
        <BuildHistoryItem>
          <BuildRound>#{artifact.id}</BuildRound>
          <ArtifactName>{artifact.name}</ArtifactName>
          <Tag type="warning">current</Tag>
          <CommitInfo artifact={artifact} />
        </BuildHistoryItem>

        {baseline && project && Link ? (
          <BuildHistoryItem>
            <Link
              to={pathFactory.project.bundle.detail({
                projectId: project.id,
                bundleId: baseline.id,
              })}
            >
              <BuildRound>#{baseline.id}</BuildRound>
            </Link>
            <ArtifactName>{baseline.name}</ArtifactName>
            <Tag type="default">baseline</Tag>
            <CommitInfo artifact={baseline} />
          </BuildHistoryItem>
        ) : (
          onBaselineSelectorOpen && (
            <BuildHistoryItem>
              <EmptyBaselineWrap onClick={onBaselineSelectorOpen}>
                <EmptyBaselineIcon>
                  <PlusCircleOutlined />
                </EmptyBaselineIcon>
                <b>{baseline ? 'No match entrypoint in baseline' : 'No baseline'}</b>
                <p>Select another version to compare</p>
              </EmptyBaselineWrap>
            </BuildHistoryItem>
          )
        )}
      </BuildHistoryContainer>
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
