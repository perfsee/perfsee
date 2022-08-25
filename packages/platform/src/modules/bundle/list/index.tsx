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

import { CalendarOutlined, HistoryOutlined, BranchesOutlined, NodeIndexOutlined } from '@ant-design/icons'
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
import { useEffect, useMemo, useCallback, memo, MouseEvent } from 'react'
import { useHistory } from 'react-router-dom'

import {
  ForeignLink,
  Pagination,
  Table,
  TeachingBubbleHost,
  ContentCard,
  useQueryString,
  Empty,
  TooltipWithEllipsis,
} from '@perfsee/components'
import { SharedColors } from '@perfsee/dls'
import { formatMsDuration } from '@perfsee/platform/common'
import { BundleJobStatus, JobType } from '@perfsee/schema'
import { getCommitLink } from '@perfsee/shared'
import { pathFactory } from '@perfsee/shared/routes'

import { BranchSelector, ArtifactNameSelector, Breadcrumb } from '../../components'
import { ProjectModule, useBreadcrumb, useGenerateProjectRoute } from '../../shared'

import { BundleListModule, Artifact } from './module'
import { BundleStatusTag } from './status-tag'
import { Score } from './style'

const tableItemStackTokens: IStackTokens = {
  childrenGap: 8,
}
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
  item: Artifact
  onRerunClick: (artifact: Artifact) => void
}

const OperationColumn = ({ item, onRerunClick }: OperationColumnProps) => {
  const onRerun = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      onRerunClick(item)
      e.stopPropagation()
    },
    [item, onRerunClick],
  )

  switch (item.status) {
    case BundleJobStatus.Failed:
      return (
        <TooltipHost key="retry" content="Rerun">
          <IconButton iconProps={rerunIconProps} onClick={onRerun} />
        </TooltipHost>
      )

    case BundleJobStatus.Passed:
      return (
        <TooltipHost key="detail" content="View Detail">
          <IconButton iconProps={detailIconProps} />
        </TooltipHost>
      )
    default:
      return null
  }
}

export const BundleList = memo(() => {
  const [state, dispatcher] = useModule(BundleListModule)
  const { project } = useModuleState(ProjectModule)
  const history = useHistory()

  const generateProjectRoute = useGenerateProjectRoute()

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

  const columns = useMemo<IColumn[]>(() => {
    if (!project) {
      return []
    }

    return [
      {
        key: 'status',
        name: 'Status',
        minWidth: 160,
        maxWidth: 200,
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
        minWidth: 100,
        maxWidth: 150,
        onRender: (item: Artifact) => `#${item.id}`,
      },
      {
        key: 'name',
        name: 'Artifact Name',
        minWidth: 100,
        maxWidth: 150,
        onRender: (item: Artifact) => <TooltipWithEllipsis content={item.name}>{item.name}</TooltipWithEllipsis>,
      },
      {
        key: 'commit',
        name: 'Commit',
        minWidth: 200,
        maxWidth: 300,
        onRender: (item: Artifact) => (
          <div>
            <Stack horizontal={true} verticalAlign="center" tokens={tableItemStackTokens}>
              <BranchesOutlined />
              <span>{item.branch}</span>
            </Stack>
            <Stack horizontal={true} verticalAlign="center" tokens={tableItemStackTokens}>
              <NodeIndexOutlined />
              <ForeignLink href={getCommitLink(project, item.hash)}>{item.hash.substring(0, 8)}</ForeignLink>
            </Stack>
          </div>
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
        minWidth: 80,
        maxWidth: 80,
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
        minWidth: 100,
        maxWidth: 100,
        onRender: (item: Artifact) => {
          return <OperationColumn item={item} onRerunClick={rerunJob} />
        },
      },
    ]
  }, [generateProjectRoute, project, rerunJob])

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
    (name: string | undefined) => {
      updateQueryString({
        page: 1,
        name,
      })
    },
    [updateQueryString],
  )

  const onChangeBranch = useCallback(
    (branch: string | undefined) => {
      updateQueryString({
        page: 1,
        branch,
      })
    },
    [updateQueryString],
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

  const breadcrumbItems = useBreadcrumb({ bundlesPage: true })

  return (
    <>
      <Breadcrumb items={breadcrumbItems} />
      <ContentCard onRenderHeader={onRenderHeader}>
        {!state.loading && !state.totalCount ? (
          <Empty title="No bundle uploaded" />
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
    </>
  )
})
