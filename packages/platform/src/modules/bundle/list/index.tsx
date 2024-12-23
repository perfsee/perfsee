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
  CalendarOutlined,
  HistoryOutlined,
  BranchesOutlined,
  NodeIndexOutlined,
  SelectOutlined,
  TagOutlined,
} from '@ant-design/icons'
import {
  IColumn,
  SelectionMode,
  Stack,
  TooltipHost,
  IStackTokens,
  IconButton,
  IIconProps,
  ITooltipProps,
} from '@fluentui/react'
import { useModule, useModuleState } from '@sigi/react'
import dayJs from 'dayjs'
import { useEffect, useMemo, useCallback, memo, MouseEvent, useRef } from 'react'
import { useHistory } from 'react-router-dom'

import {
  Pagination,
  Table,
  TeachingBubbleHost,
  ContentCard,
  useQueryString,
  Empty,
  TooltipWithEllipsis,
  Modal,
  ModalType,
  useToggleState,
  ForeignLink,
} from '@perfsee/components'
import { SharedColors } from '@perfsee/dls'
import { formatMsDuration } from '@perfsee/platform/common'
import { BundleJobStatus, JobType, Permission } from '@perfsee/schema'
import { PrettyBytes } from '@perfsee/shared'
import { pathFactory, staticPath } from '@perfsee/shared/routes'

import { BranchSelector, ArtifactNameSelector } from '../../components'
import { Commit } from '../../components/commit'
import { ProjectInfo, ProjectModule, useProjectRouteGenerator } from '../../shared'

import { BundleListModule, Artifact } from './module'
import { BundleStatusTag } from './status-tag'
import { InformationContainer, Score } from './style'

const tableItemStackTokens: IStackTokens = {
  childrenGap: 8,
}
const deleteIconProps: IIconProps = { iconName: 'delete', styles: { root: { color: SharedColors.red10 } } }
const rerunIconProps: IIconProps = { iconName: 'RedoOutlined', styles: { root: { transform: 'rotate(-90deg)' } } }
const detailIconProps: IIconProps = {
  iconName: 'DoubleRightOutlined',
}

const errorDetailTooltipProps: ITooltipProps = {
  styles: {
    content: { whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: SharedColors.red10 },
  },
}

interface OperationColumnProps {
  project: ProjectInfo
  item: Artifact
  onRerunClick: (artifact: Artifact) => void
  onDelete: (artifact: Artifact) => void
}

const OperationColumn = ({ item, project, onRerunClick, onDelete }: OperationColumnProps) => {
  const onRerun = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      onRerunClick(item)
      e.stopPropagation()
    },
    [item, onRerunClick],
  )

  const onClickDelete = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation()
      onDelete(item)
    },
    [item, onDelete],
  )

  const deleteButton = useMemo(() => {
    if (!project || !project.userPermission.includes(Permission.Admin)) {
      return null
    }

    return (
      <TooltipHost
        key="delete"
        content={`${PrettyBytes.create(item.uploadSize)} storage will be released after delete`}
      >
        <IconButton iconProps={deleteIconProps} onClick={onClickDelete} />
      </TooltipHost>
    )
  }, [item.uploadSize, onClickDelete, project])

  switch (item.status) {
    case BundleJobStatus.Failed:
      return (
        <Stack horizontal tokens={{ childrenGap: 8 }}>
          <TooltipHost key="retry" content="Rerun">
            <IconButton iconProps={rerunIconProps} onClick={onRerun} />
          </TooltipHost>
          {deleteButton}
        </Stack>
      )

    case BundleJobStatus.Passed:
      return (
        <Stack horizontal tokens={{ childrenGap: 8 }}>
          <TooltipHost key="detail" content="View Detail">
            <IconButton iconProps={detailIconProps} />
          </TooltipHost>
          {deleteButton}
        </Stack>
      )
    default:
      return null
  }
}

export const BundleList = memo(() => {
  const [state, dispatcher] = useModule(BundleListModule)
  const { project } = useModuleState(ProjectModule)
  const history = useHistory()
  const [deleteModalVisible, showDeleteModal, hideDeleteModal] = useToggleState(false)
  const deletingArtifact = useRef<Artifact | null>()

  const generateProjectRoute = useProjectRouteGenerator()

  const [{ page = 1, pageSize = 20, branch, name }, updateQueryString] = useQueryString<{
    page: number
    pageSize: number
    branch: string
    name: string
  }>()

  useEffect(() => {
    dispatcher.getArtifacts({
      pageNum: page,
      pageSize,
      branch,
      name,
    })
    return () => {
      if (!project) {
        dispatcher.resetState()
      }
    }
  }, [branch, dispatcher, name, page, pageSize, project])

  const viewDetail = useCallback(
    (artifact: Artifact) => {
      const path = generateProjectRoute(pathFactory.project.bundle.detail, {
        bundleId: artifact.id,
      })
      history.push(path)
    },
    [generateProjectRoute, history],
  )

  const rerunJob = useCallback(
    (artifact: Artifact) => {
      dispatcher.dispatchNewJob(artifact.id)
    },
    [dispatcher],
  )

  const onDeleteArtifact = useCallback(
    (artifact: Artifact) => {
      deletingArtifact.current = artifact
      showDeleteModal()
    },
    [showDeleteModal],
  )

  const confirmDelete = useCallback(() => {
    hideDeleteModal()

    if (deletingArtifact.current) {
      dispatcher.deleteArtifact(deletingArtifact.current.id)
      deletingArtifact.current = null
    }
  }, [dispatcher, hideDeleteModal])

  const cancelDelete = useCallback(() => {
    hideDeleteModal()
    deletingArtifact.current = null
  }, [hideDeleteModal])

  const columns = useMemo<IColumn[]>(() => {
    if (!project) {
      return []
    }

    return [
      {
        key: 'status',
        name: 'Status',
        minWidth: 100,
        maxWidth: 120,
        onRender: (item: Artifact) => {
          if (item) {
            const status = (
              <BundleStatusTag
                href={generateProjectRoute(pathFactory.project.jobTrace, {
                  type: JobType.BundleAnalyze,
                  entityId: item.id,
                })}
                status={item.status}
              />
            )
            if (item.status === BundleJobStatus.Failed) {
              return (
                <TooltipHost tooltipProps={errorDetailTooltipProps} content={item.failedReason!}>
                  {status}
                </TooltipHost>
              )
            }
            return status
          }
        },
      },
      {
        key: 'artifact',
        name: 'Artifact',
        minWidth: 60,
        maxWidth: 80,
        onRender: (item: Artifact) => `#${item.id}`,
      },
      {
        key: 'name',
        name: 'Artifact Name',
        minWidth: 100,
        maxWidth: 220,
        onRender: (item: Artifact) => <TooltipWithEllipsis content={item.name}>{item.name}</TooltipWithEllipsis>,
      },
      {
        key: 'commit',
        name: 'Commit',
        minWidth: 300,
        maxWidth: 400,
        onRender: (item: Artifact) => (
          <InformationContainer>
            <Stack horizontal={true} verticalAlign="center" tokens={tableItemStackTokens}>
              <BranchesOutlined />
              <span>{item.branch}</span>
              {item.version?.version ? (
                <>
                  <TagOutlined />
                  <span>{item.version?.version}</span>
                </>
              ) : null}
            </Stack>
            <Stack horizontal={true} verticalAlign="center" tokens={tableItemStackTokens}>
              <NodeIndexOutlined />
              <Commit commitMessage={item.version?.commitMessage} hash={item.hash} />
            </Stack>
          </InformationContainer>
        ),
      },
      {
        key: 'timing',
        name: 'Timing',
        minWidth: 150,
        maxWidth: 200,
        onRender: (item: Artifact) => (
          <TooltipHost content={new Date(item.createdAt).toLocaleString()}>
            <div>
              <Stack horizontal={true} verticalAlign="center" tokens={tableItemStackTokens}>
                <HistoryOutlined />
                <span>{formatMsDuration(item.duration)}</span>
              </Stack>
              <Stack horizontal={true} verticalAlign="center" tokens={tableItemStackTokens}>
                <CalendarOutlined />
                <span>{dayJs(item.createdAt).fromNow()}</span>
              </Stack>
            </div>
          </TooltipHost>
        ),
      },
      {
        key: 'score',
        name: 'Score',
        minWidth: 60,
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
        key: 'operations',
        name: '',
        minWidth: 150,
        maxWidth: 150,
        onRender: (item: Artifact) => {
          return <OperationColumn project={project} item={item} onRerunClick={rerunJob} onDelete={onDeleteArtifact} />
        },
      },
    ]
  }, [generateProjectRoute, onDeleteArtifact, project, rerunJob])

  const onPageChange = useCallback(
    (pageNum: number, pageSize: number) => {
      updateQueryString({
        page: pageNum,
        pageSize,
      })
    },
    [updateQueryString],
  )

  const onChangeArtifactName = useCallback(
    (changedName: string | undefined) => {
      if (changedName !== name) {
        updateQueryString({
          page: 1,
          name: changedName,
        })
      }
    },
    [updateQueryString, name],
  )

  const onChangeBranch = useCallback(
    (changedBranch: string | undefined) => {
      if (changedBranch !== branch) {
        updateQueryString({
          page: 1,
          branch: changedBranch,
        })
      }
    },
    [updateQueryString, branch],
  )

  const onRenderHeader = useCallback(
    () => (
      <Stack horizontal horizontalAlign="space-between" verticalAlign="center" styles={{ root: { flexGrow: 1 } }}>
        <span>Bundle List</span>
        <Stack horizontal tokens={{ childrenGap: 8 }}>
          <ArtifactNameSelector defaultArtifactName={name} onChange={onChangeArtifactName} />
          <TeachingBubbleHost
            teachingId="bundle-list-branch"
            visible={!state.loading}
            delay={500}
            headline="Select Branch Here"
            body="You can filter bundles by branch name."
          >
            <BranchSelector defaultBranch={branch} onChange={onChangeBranch} />
          </TeachingBubbleHost>
        </Stack>
      </Stack>
    ),
    [branch, name, onChangeArtifactName, onChangeBranch, state.loading],
  )

  return (
    <>
      <ContentCard onRenderHeader={onRenderHeader}>
        {!state.loading && !state.totalCount ? (
          <Stack horizontalAlign="center" tokens={{ childrenGap: 12 }}>
            <Empty title="No bundle uploaded" />
            <ForeignLink href={staticPath.docs.home + '/bundle/get-started'}>
              See how to upload bundles <SelectOutlined />
            </ForeignLink>
          </Stack>
        ) : (
          <>
            <Table
              items={state.artifacts}
              enableShimmer={state.loading}
              columns={columns}
              selectionMode={SelectionMode.none}
              detailsListStyles={{
                headerWrapper: { '> div[role=row]': { paddingTop: 0 } },
                root: { cursor: 'pointer' },
              }}
              onRowClick={viewDetail}
            />
            <Pagination
              page={page}
              total={state.totalCount}
              pageSize={pageSize}
              onChange={onPageChange}
              hideOnSinglePage={true}
              showSizeChanger={true}
            />
          </>
        )}
      </ContentCard>
      <Modal
        type={ModalType.Warning}
        title="Delete artifact"
        isOpen={deleteModalVisible}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
      >
        <Stack tokens={{ padding: '12px', childrenGap: '4px' }}>
          <span>
            Are you sure to delete artifact <b>#{deletingArtifact.current?.id}</b>? All data related will be deleted
            together and can not be restored.
          </span>
          <span>
            About <b>{PrettyBytes.create(deletingArtifact.current?.uploadSize ?? 0).toString()}</b> storage size will be
            released after delete.
          </span>
        </Stack>
      </Modal>
    </>
  )
})
