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

import { CloseOutlined } from '@ant-design/icons'
import { Modal, SelectionMode, TooltipHost } from '@fluentui/react'
import { useModule } from '@sigi/react'
import dayjs from 'dayjs'
import { FC, useState, useEffect, useMemo, useCallback } from 'react'

import { Pagination, Table, TableColumnProps } from '@perfsee/components'

import { useProject } from '../../shared'
import { ArtifactNameSelector } from '../bundle-property'

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
        minWidth: 50,
        name: 'id',
        onRender(item) {
          return `#${item.id}`
        },
      },
      {
        key: 'name',
        name: 'name',
        minWidth: 150,
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
        minWidth: 100,
        name: 'commit',
        fieldName: 'hash',
      },
      {
        key: 'branch',
        minWidth: 200,
        name: 'branch',
        onRender(item) {
          return (
            <TooltipHost content={item.branch}>
              <EllipsisDiv>{item.branch}</EllipsisDiv>
            </TooltipHost>
          )
        },
      },
      {
        key: 'created',
        minWidth: 200,
        name: 'created at',
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
      dispatcher.fetchArtifacts({ projectId: project.id, pageNumber: page - 1, pageSize: PAGE_SIZE, artifactName })
    }
  }, [artifactName, dispatcher, page, project])

  useEffect(() => dispatcher.reset(), [dispatcher])

  return (
    <Modal isOpen={true} styles={{ scrollableContent: { overflow: 'visible' } }} onDismiss={onDismiss}>
      <Header>
        <span>Select baseline</span>

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
