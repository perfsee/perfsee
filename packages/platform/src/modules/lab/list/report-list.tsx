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

import { Spinner, SelectionMode, TooltipHost, DetailsRow, Text, IDetailsRowProps, Stack } from '@fluentui/react'
import { useModule } from '@sigi/react'
import { useMemo, useCallback, useRef } from 'react'
import { useHistory } from 'react-router'

import {
  Table,
  TableColumnProps,
  disabledVirtualization,
  VerticalCenteredStyles,
  ScoreIcon,
  TooltipWithEllipsis,
  ColorButton,
  getScoreColor,
  Modal,
  ModalType,
  useToggleState,
} from '@perfsee/components'
import { SharedColors } from '@perfsee/dls'
import { JobType, SnapshotStatus } from '@perfsee/schema'
import { PrettyBytes, getReportMessage } from '@perfsee/shared'
import { pathFactory } from '@perfsee/shared/routes'

import { useProjectRouteGenerator, useProject } from '../../shared'
import { StatusText, ListCell, TableContainer } from '../style'

import { LabListModule, ReportsPayload, SnapshotReportSchema } from './module'
import { OperationButton, PageName, getDetailUrl } from './report-item-comps'

type Props = {
  snapshotId: number
  failedReason: string | null
  onClose: () => void
}

export const LabReportList = ({ snapshotId, failedReason, onClose }: Props) => {
  const project = useProject()
  const history = useHistory()
  const generateProjectRoute = useProjectRouteGenerator()
  const [state, dispatcher] = useModule(LabListModule, {
    selector: (s) => s.reportsWithId[snapshotId] as ReportsPayload<false>,
    dependencies: [snapshotId],
  })

  const [deleteModalVisible, showDeleteModal, hideDeleteModal] = useToggleState(false)
  const deletingReport = useRef<SnapshotReportSchema | null>()

  const { loading, reports } = state ?? { loading: true, reports: [] }

  const onDeleteReport = useCallback(
    (artifact: SnapshotReportSchema) => {
      deletingReport.current = artifact
      showDeleteModal()
    },
    [showDeleteModal],
  )

  const confirmDelete = useCallback(() => {
    hideDeleteModal()

    if (deletingReport.current) {
      dispatcher.deleteSnapshotReport({ reportId: deletingReport.current.id, snapshotId })
      deletingReport.current = null
    }
  }, [dispatcher, hideDeleteModal, snapshotId])

  const cancelDelete = useCallback(() => {
    hideDeleteModal()
    deletingReport.current = null
  }, [hideDeleteModal])

  const columns: TableColumnProps<SnapshotReportSchema>[] = useMemo(
    () => [
      {
        key: 'page',
        name: 'Page',
        minWidth: 100,
        sorter: (a, b) => a.page.name.localeCompare(b.page.name),
        onRender: (report) => <PageName report={report} />,
      },
      {
        key: 'performance',
        name: 'Performance',
        minWidth: 100,
        maxWidth: 100,
        sorter: (a, b) => {
          const scoreA = typeof a.performanceScore === 'number' ? a.performanceScore : -1
          const scoreB = typeof b.performanceScore === 'number' ? b.performanceScore : -1
          return scoreA - scoreB
        },
        onRender: (report) => {
          if (
            typeof report.performanceScore !== 'number' ||
            ![SnapshotStatus.Completed, SnapshotStatus.PartialCompleted].includes(report.status)
          ) {
            return 'Not available'
          }
          if (report.performanceScore === 0) {
            return 'View in report'
          }
          const score = report.performanceScore
          const color = getScoreColor(score)
          return (
            <Text styles={{ root: { color, fontSize: 14, '> :last-child': { marginLeft: '4px' } } }}>
              {score}
              <ScoreIcon score={score} />
            </Text>
          )
        },
      },
      {
        key: 'env',
        name: 'Env',
        minWidth: 80,
        maxWidth: 180,
        onRender: (report) => <TooltipWithEllipsis content={report.environment.name} />,
      },
      {
        key: 'profile',
        name: 'Profile',
        minWidth: 80,
        maxWidth: 180,
        onRender: (report) => <TooltipWithEllipsis content={report.profile.name} />,
      },
      {
        key: 'status',
        name: 'Status',
        minWidth: 120,
        maxWidth: 180,
        onRender: (report) => {
          const showTip =
            (report.status === SnapshotStatus.Failed && report.failedReason) ||
            report.status === SnapshotStatus.PartialCompleted

          return (
            <TooltipHost content={getReportMessage(report)} hidden={!showTip}>
              <StatusText
                href={generateProjectRoute(pathFactory.project.jobTrace, {
                  type: report.page.isE2e ? JobType.E2EAnalyze : JobType.LabAnalyze,
                  entityId: report.id,
                })}
                status={report.status}
              >
                {report.status}
              </StatusText>
            </TooltipHost>
          )
        },
      },
      {
        key: 'operations',
        name: '',
        minWidth: 160,
        maxWidth: 160,
        onRender: (report) => {
          return (
            <OperationButton project={project!} snapshotId={snapshotId} report={report} onDelete={onDeleteReport} />
          )
        },
      },
    ],
    [generateProjectRoute, project, snapshotId, onDeleteReport],
  )

  const onDeleteSnapshot = useCallback(() => {
    dispatcher.deleteSnapshot(snapshotId)
    onClose()
  }, [dispatcher, snapshotId, onClose])

  const onRowClick = useCallback(
    (report: SnapshotReportSchema) => () => {
      if (report.status === SnapshotStatus.Completed || report.status === SnapshotStatus.PartialCompleted) {
        const url = getDetailUrl(report, project!.id)
        history.push(url)
      }
    },
    [history, project],
  )

  const onRenderRow = useCallback(
    (props?: IDetailsRowProps) => {
      if (!props) {
        return null
      }

      return (
        <DetailsRow
          {...props}
          styles={VerticalCenteredStyles}
          data-selection-disabled={true}
          onClick={onRowClick(props.item)}
        />
      )
    },
    [onRowClick],
  )

  if (loading) {
    return (
      <ListCell css={{ justifyContent: 'center' }} key="loading">
        <Spinner />
      </ListCell>
    )
  }

  if (!reports?.length) {
    return (
      <ListCell css={{ justifyContent: 'center' }} key="no-data">
        {failedReason ? (
          <p>{failedReason}</p>
        ) : (
          <ColorButton color={SharedColors.red10} onClick={onDeleteSnapshot}>
            Delete Snapshot
          </ColorButton>
        )}
      </ListCell>
    )
  }

  return (
    <>
      <TableContainer>
        <Table
          selectionMode={SelectionMode.none}
          items={reports}
          columns={columns}
          onShouldVirtualize={disabledVirtualization}
          onRenderRow={onRenderRow}
          checkboxCellClassName="checkboxCell"
        />
      </TableContainer>
      <Modal
        type={ModalType.Warning}
        title="Delete report"
        isOpen={deleteModalVisible}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
      >
        <Stack tokens={{ padding: '12px', childrenGap: '4px' }}>
          <span>
            Are you sure to delete report <b>#{deletingReport.current?.id}</b>? All data related will be deleted
            together and can not be restored.
          </span>
          <span>
            About <b>{PrettyBytes.create(deletingReport.current?.uploadSize ?? 0).toString()}</b> storage size will be
            released after delete.
          </span>
        </Stack>
      </Modal>
    </>
  )
}
