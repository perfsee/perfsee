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

import { CloseOutlined, BranchesOutlined, TagOutlined } from '@ant-design/icons'
import { Modal, SelectionMode, TooltipHost, Stack } from '@fluentui/react'
import { useModule } from '@sigi/react'
import dayjs from 'dayjs'
import { FC, useState, useEffect, useMemo, useCallback } from 'react'

import { Pagination, Table, TableColumnProps } from '@perfsee/components'
import { BundleJobStatus } from '@perfsee/schema'

import { Score } from '../../bundle/list/style'
import { useProject } from '../../shared'
import { ArtifactNameSelector, BranchSelector } from '../bundle-property'
import { Commit } from '../commit'

import { ArtifactSelectModule, Artifact } from './module'
import {
  Description,
  DisabledOperationSpan,
  EllipsisDiv,
  Header,
  IconWrapper,
  OperationSpan,
  PaginationWrap,
  TableWrap,
} from './style'

type Props = {
  currentArtifactId?: number
  description?: React.ReactNode
  defaultArtifactName?: string
  onSelect?: (payload: ArtifactSelectEventPayload) => void
  onDismiss?: () => void
}

export type ArtifactSelectEventPayload = {
  artifact: Artifact
}

const PAGE_SIZE = 12

export const ArtifactSelect: FC<Props> = (props) => {
  const { currentArtifactId, description, defaultArtifactName, onSelect, onDismiss } = props

  const [state, dispatcher] = useModule(ArtifactSelectModule)
  const project = useProject()
  const [page, setPage] = useState(1)
  const [artifactName, setArtifactName] = useState(defaultArtifactName)
  const [branch, setBranch] = useState<string>()

  const handleSelect = useCallback(
    (artifact: Artifact) => () => {
      typeof onSelect === 'function' && onSelect({ artifact })
    },
    [onSelect],
  )

  const columns = useMemo<TableColumnProps<Artifact>[]>(
    () => [
      {
        key: 'id',
        minWidth: 40,
        maxWidth: 60,
        name: 'Id',
        onRender(item) {
          return `#${item.id}`
        },
      },
      {
        key: 'name',
        name: 'Name',
        minWidth: 80,
        maxWidth: 140,
        onRender(item) {
          return (
            <TooltipHost content={item.name}>
              <EllipsisDiv>{item.name}</EllipsisDiv>
            </TooltipHost>
          )
        },
      },
      {
        key: 'commit',
        minWidth: 200,
        maxWidth: 400,
        name: 'Commit',
        onRender(item) {
          return <Commit hash={item.hash} commitMessage={item.version?.commitMessage} />
        },
      },
      {
        key: 'branch',
        minWidth: 200,
        maxWidth: 400,
        name: 'Branch',
        onRender(item) {
          return (
            <Stack tokens={{ childrenGap: 8 }} horizontal verticalAlign="center">
              {item.branch ? (
                <Stack tokens={{ childrenGap: 4 }} horizontal verticalAlign="center">
                  <BranchesOutlined />
                  <TooltipHost content={item.branch}>
                    <EllipsisDiv>{item.branch}</EllipsisDiv>
                  </TooltipHost>
                </Stack>
              ) : null}
              {item.version?.version ? (
                <Stack tokens={{ childrenGap: 4 }} horizontal verticalAlign="center">
                  <TagOutlined />
                  <TooltipHost content={item.version.version}>
                    <EllipsisDiv>{item.version.version}</EllipsisDiv>
                  </TooltipHost>
                </Stack>
              ) : null}
            </Stack>
          )
        },
      },
      {
        key: 'score',
        name: 'Score',
        minWidth: 40,
        maxWidth: 60,
        onRender: (artifact: Artifact) => {
          if (artifact.status !== BundleJobStatus.Passed) {
            return null
          }

          if (artifact.score === null) {
            return <>No Score</>
          }

          return <Score score={artifact.score}>{artifact.score}</Score>
        },
      },
      {
        key: 'created',
        minWidth: 140,
        maxWidth: 200,
        name: 'Created At',
        onRender(item) {
          return dayjs(item.createdAt).format('YYYY/MM/DD HH:mm:ss')
        },
      },
      {
        key: 'operation',
        name: '',
        minWidth: 50,
        onRender(item) {
          if (currentArtifactId === item.id) {
            return <DisabledOperationSpan>Current</DisabledOperationSpan>
          }
          return <OperationSpan onClick={handleSelect(item)}>Select</OperationSpan>
        },
      },
    ],
    [currentArtifactId, handleSelect],
  )

  useEffect(() => {
    if (project) {
      dispatcher.fetchArtifacts({
        projectId: project.id,
        pageNumber: page - 1,
        pageSize: PAGE_SIZE,
        artifactName,
        branch,
      })
    }
  }, [artifactName, dispatcher, page, project, branch])

  useEffect(() => dispatcher.reset(), [dispatcher])

  return (
    <Modal isOpen={true} styles={{ scrollableContent: { overflow: 'visible', width: 1200 } }} onDismiss={onDismiss}>
      <Header>
        <span>Select baseline</span>

        <BranchSelector defaultBranch={branch} onChange={setBranch} />
        <ArtifactNameSelector defaultArtifactName={defaultArtifactName} onChange={setArtifactName} />
        <IconWrapper onClick={onDismiss}>
          <CloseOutlined />
        </IconWrapper>
      </Header>
      {description && <Description>{description}</Description>}

      <TableWrap>
        <Table
          columns={columns}
          items={state.artifacts}
          enableShimmer={state.loading}
          shimmerLines={PAGE_SIZE}
          selectionMode={SelectionMode.none}
        />
        <PaginationWrap>
          <Pagination page={page} total={state.totalNum} pageSize={PAGE_SIZE} onChange={setPage} />
        </PaginationWrap>
      </TableWrap>
    </Modal>
  )
}
