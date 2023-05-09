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

import { BranchesOutlined, CalendarOutlined, HistoryOutlined, NodeIndexOutlined } from '@ant-design/icons'
import {
  IColumn,
  IconButton,
  IIconProps,
  ITooltipProps,
  SelectionMode,
  SharedColors,
  Stack,
  TooltipHost,
} from '@fluentui/react'
import { useModule, useModuleState } from '@sigi/react'
import dayjs from 'dayjs'
import { memo, MouseEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useHistory } from 'react-router'

import { Pagination, Table } from '@perfsee/components'
import { formatMsDuration, PrettyBytes } from '@perfsee/platform/common'
import { BundleJobStatus, JobType, Permission } from '@perfsee/schema'
import { pathFactory } from '@perfsee/shared/routes'

import { BundleStatusTag } from '../../bundle/list/status-tag'
import { Commit } from '../../components/commit'
import { ProjectInfo, ProjectModule, useProjectRouteGenerator } from '../../shared'

import { PackageBundle, PackageListModule } from './module'
import { InformationContainer, PackageTable } from './styles'

interface Props {
  packageId: number
  bundles: PackageBundle[]
  totalCount: number
  branch?: string
}

const tableItemStackTokens = {
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

const defaultState = {
  page: 1,
  pageSize: 5,
}

export const PackageBundleTableList = memo(({ bundles, totalCount, branch, packageId }: Props) => {
  const [{ page, pageSize }, updatePagination] = useState<{
    page: number
    pageSize: number
  }>(defaultState)
  const { project } = useModuleState(ProjectModule)
  const generateProjectRoute = useProjectRouteGenerator()
  const history = useHistory()
  const [_, dispatcher] = useModule(PackageListModule)

  const hasUpdatedSearchFilter = useRef(false)

  useEffect(() => {
    if (branch || page !== defaultState.page || pageSize !== defaultState.pageSize || hasUpdatedSearchFilter.current) {
      dispatcher.getBundles({
        packageId,
        pageNum: page,
        pageSize,
        branch,
      })
      hasUpdatedSearchFilter.current = true
    }
  }, [page, pageSize, branch, packageId, dispatcher])

  const onDeleteArtifact = useCallback(
    (bundle: PackageBundle) => {
      dispatcher.deleteBundle({ packageId, packageBundleId: bundle.id })
    },
    [dispatcher, packageId],
  )

  const rerunJob = useCallback(
    (bundle: PackageBundle) => {
      dispatcher.dispatchNewJob({ packageId, packageBundleId: bundle.id })
    },
    [dispatcher, packageId],
  )

  const columns = useMemo<IColumn[]>(() => {
    if (!project) {
      return []
    }

    return [
      {
        key: 'status',
        name: 'Status',
        minWidth: 100,
        maxWidth: 200,
        onRender: (item: PackageBundle) => {
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
        key: 'packageBundle',
        name: 'Bundle',
        minWidth: 50,
        maxWidth: 100,
        onRender: (item: PackageBundle) => `#${item.id}`,
      },
      {
        key: 'commit',
        name: 'Commit',
        minWidth: 200,
        maxWidth: 300,
        onRender: (item: PackageBundle) => (
          <InformationContainer>
            <Stack horizontal={true} verticalAlign="center" tokens={tableItemStackTokens}>
              <BranchesOutlined />
              <span>{item.branch}</span>
            </Stack>
            <Stack horizontal={true} verticalAlign="center" tokens={tableItemStackTokens}>
              <NodeIndexOutlined />
              <Commit commitMessage={item.appVersion?.commitMessage} hash={item.hash} />
            </Stack>
          </InformationContainer>
        ),
      },
      {
        key: 'version',
        name: 'Version',
        minWidth: 150,
        maxWidth: 200,
        onRender: (item: PackageBundle) => <span>{item.version}</span>,
      },
      {
        key: 'timing',
        name: 'Timing',
        minWidth: 150,
        maxWidth: 200,
        onRender: (item: PackageBundle) => (
          <TooltipHost content={new Date(item.createdAt).toLocaleString()}>
            <div>
              <Stack horizontal={true} verticalAlign="center" tokens={tableItemStackTokens}>
                <HistoryOutlined />
                <span>{formatMsDuration(item.duration)}</span>
              </Stack>
              <Stack horizontal={true} verticalAlign="center" tokens={tableItemStackTokens}>
                <CalendarOutlined />
                <span>{dayjs(item.createdAt).fromNow()}</span>
              </Stack>
            </div>
          </TooltipHost>
        ),
      },

      {
        key: 'operations',
        name: '',
        minWidth: 150,
        maxWidth: 150,
        onRender: (item: PackageBundle) => {
          return <OperationColumn project={project} item={item} onRerunClick={rerunJob} onDelete={onDeleteArtifact} />
        },
      },
    ]
  }, [generateProjectRoute, onDeleteArtifact, project, rerunJob])

  const onPageChange = useCallback(
    (pageNum: number, pageSize: number) => {
      updatePagination((prev) => ({
        ...prev,
        page: pageNum,
        pageSize,
      }))
    },
    [updatePagination],
  )

  const viewDetail = useCallback(
    (packageBundle: PackageBundle) => {
      const path = generateProjectRoute(pathFactory.project.package.detail, {
        packageId: packageBundle.packageId,
        packageBundleId: packageBundle.id,
      })
      history.push(path)
    },
    [generateProjectRoute, history],
  )

  return (
    <PackageTable>
      <Stack>
        <Table
          items={bundles}
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
          total={totalCount}
          pageSize={pageSize}
          onChange={onPageChange}
          hideOnSinglePage={true}
          showSizeChanger={true}
        />
      </Stack>
    </PackageTable>
  )
})

interface OperationColumnProps {
  project: ProjectInfo
  item: PackageBundle
  onRerunClick: (artifact: PackageBundle) => void
  onDelete: (artifact: PackageBundle) => void
}

const OperationColumn = memo(({ item, project, onRerunClick, onDelete }: OperationColumnProps) => {
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
})
