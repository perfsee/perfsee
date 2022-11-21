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

import { DeleteOutlined, MinusOutlined, PlusOutlined } from '@ant-design/icons'
import { IconButton, IIconProps, TooltipHost, ActionButton, SharedColors, Stack } from '@fluentui/react'
import { useDispatchers, useModule } from '@sigi/react'
import { FC, useCallback, useMemo, MouseEvent } from 'react'

import { TooltipWithEllipsis } from '@perfsee/components'
import { Permission, SnapshotStatus } from '@perfsee/schema'
import { PrettyBytes } from '@perfsee/shared'
import { pathFactory } from '@perfsee/shared/routes'

import { CompareModule, ProjectInfo } from '../../shared'
import { PerformanceTabType } from '../../snapshots/snapshot-type'
import { DisabledText, NoticeLabel } from '../style'

import { LabListModule, SnapshotReportSchema } from './module'
import { CompareButtonInner, DeleteButtonInner } from './style'

const rerunIconProps: IIconProps = { iconName: 'RedoOutlined', styles: { root: { transform: 'rotate(-90deg)' } } }

type Props = {
  snapshotId: number
  report: SnapshotReportSchema
  project: ProjectInfo
  onDelete: (report: SnapshotReportSchema) => void
}

export const getDetailUrl = (report: SnapshotReportSchema, projectId: string) => {
  return pathFactory.project.lab.report({
    projectId,
    tabName: PerformanceTabType.Overview,
    reportId: report.id,
  })
}

export const OperationButton = ({ snapshotId, report, project, onDelete }: Props) => {
  const dispatcher = useDispatchers(LabListModule)
  const [{ compareReports }, labDispatcher] = useModule(CompareModule)

  const inCompareList = useMemo(() => {
    return compareReports[project.id]?.[report.id]
  }, [compareReports, report.id, project.id])

  const onRerun = useCallback(() => {
    dispatcher.rerunSnapshotReport({ id: report.id, snapshotId: snapshotId })
  }, [dispatcher, report.id, snapshotId])

  const onAddCompare = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation()

      labDispatcher.addReport({
        projectId: project.id,
        reportId: report.id,
        data: {
          name: report.page.name,
          snapshotId,
        },
      })
    },
    [labDispatcher, project.id, report.id, report.page.name, snapshotId],
  )

  const onDeleteReport = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation()

      onDelete(report)
    },
    [onDelete, report],
  )

  const onRemoveCompare = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation()
      labDispatcher.removeReport({
        projectId: project.id,
        snapshotId,
        reportId: report.id,
      })
    },
    [labDispatcher, project.id, report.id, snapshotId],
  )

  const deleteButton = useMemo(() => {
    if (!project || !project.userPermission.includes(Permission.Admin)) {
      return null
    }

    return (
      <TooltipHost content={`${PrettyBytes.create(report.uploadSize)} storage will be released after delete`}>
        <ActionButton onClick={onDeleteReport}>
          <DeleteButtonInner>
            <DeleteOutlined />
            Delete
          </DeleteButtonInner>
        </ActionButton>
      </TooltipHost>
    )
  }, [onDeleteReport, project, report.uploadSize])

  if (report.status === SnapshotStatus.Failed) {
    return (
      <TooltipHost key="retry" content="Rerun">
        <IconButton iconProps={rerunIconProps} onClick={onRerun} />
      </TooltipHost>
    )
  } else if (report.status === SnapshotStatus.Completed && !report.page.isE2e) {
    if (inCompareList) {
      return (
        <Stack horizontal verticalAlign="center" tokens={{ childrenGap: '8px' }}>
          <TooltipHost key="remove-compare" content="Remove from compare reports">
            <ActionButton onClick={onRemoveCompare}>
              <CompareButtonInner>
                <MinusOutlined />
                Remove
              </CompareButtonInner>
            </ActionButton>
          </TooltipHost>
          {deleteButton}
        </Stack>
      )
    } else {
      return (
        <Stack horizontal verticalAlign="center" tokens={{ childrenGap: '8px' }}>
          <TooltipHost key="compare" content="Add report to compare">
            <ActionButton onClick={onAddCompare}>
              <CompareButtonInner>
                <PlusOutlined />
                Compare
              </CompareButtonInner>
            </ActionButton>
          </TooltipHost>
          {deleteButton}
        </Stack>
      )
    }
  }

  return null
}

export const PageName: FC<{ report: SnapshotReportSchema }> = (props) => {
  const { report } = props

  const competitor = report.page.isCompetitor ? <NoticeLabel>[Competitor]</NoticeLabel> : null
  const e2e = report.page.isE2e ? <NoticeLabel>[E2E]</NoticeLabel> : null
  if (report.status !== SnapshotStatus.Completed) {
    return (
      <TooltipWithEllipsis content={report.page.name}>
        <DisabledText>{report.page.name}</DisabledText>
        {competitor}
        {e2e}
      </TooltipWithEllipsis>
    )
  }

  return (
    <TooltipWithEllipsis content={report.page.name}>
      <span style={{ color: SharedColors.cyanBlue10, cursor: 'pointer' }}>{report.page.name}</span>
      {competitor}
      {e2e}
    </TooltipWithEllipsis>
  )
}
