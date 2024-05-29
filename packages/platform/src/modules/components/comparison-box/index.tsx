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

import { DoubleRightOutlined, MinusCircleOutlined } from '@ant-design/icons'
import { Callout, Stack, PrimaryButton, DirectionalHint, SelectionMode } from '@fluentui/react'
import { useModule } from '@sigi/react'
import { stringifyUrl } from 'query-string'
import { useCallback, useMemo, useRef } from 'react'
import { useHistory } from 'react-router-dom'

import { Badge, TeachingBubbleHost, Table, TableColumnProps, TooltipWithEllipsis } from '@perfsee/components'
import { PerformanceTabType } from '@perfsee/lab-report/snapshot-type'
import { pathFactory } from '@perfsee/shared/routes'

import { CompareModule, CompareReport, CompetitorMaxCount, useProject } from '../../shared'

import { CalloutHeader, Container, IconBox, SelectMoreTip, StartCompareButtonInner, StyledInboxOutlined } from './style'

const tokens = { childrenGap: 10, padding: '16px' }
const stackStyles = { root: { maxWidth: '600px', minWidth: '200px' } }
const columns: TableColumnProps<[string, CompareReport]>[] = [
  {
    key: 'name',
    minWidth: 100,
    name: 'Name',
    onRender(item) {
      return <TooltipWithEllipsis content={item[1].name} tooltipContent={item[1].name} />
    },
  },
  {
    key: 'snapshot',
    minWidth: 70,
    name: 'Snapshot',
    onRender(item) {
      return `#${item[1].snapshotId}`
    },
  },
]

export const ComparisonBox = () => {
  const history = useHistory()
  const project = useProject()

  const iconRef = useRef<HTMLDivElement>(null)

  const [{ compareReports, calloutVisible }, dispatcher] = useModule(CompareModule)

  const projectReports: Record<string, CompareReport> = useMemo(
    () => (project ? compareReports[project.id] ?? {} : {}),
    [compareReports, project],
  )

  const reportIds = useMemo(() => {
    return Object.keys(projectReports).map((reportId) => reportId)
  }, [projectReports])

  const badgeCount = useMemo(() => {
    const count = reportIds.length

    // hide badge dot when no report
    return count ? count : undefined
  }, [reportIds])

  const showCallout = useCallback(() => {
    dispatcher.setCalloutVisible(true)
  }, [dispatcher])

  const hideCallout = useCallback(() => {
    dispatcher.setCalloutVisible(false)
  }, [dispatcher])

  const onClick = useCallback(() => {
    if (!project) {
      return
    }

    history.push(
      stringifyUrl({
        url: pathFactory.project.competitor.report({
          projectId: project.id,
          tabName: PerformanceTabType.Overview,
        }),
        query: {
          report_ids: reportIds.join(','),
        },
      }),
    )
  }, [history, project, reportIds])

  const removeReport = useCallback(
    (id: number) => () => dispatcher.removeReport({ projectId: project!.id, reportId: id }),
    [dispatcher, project],
  )

  const formatColumns = useMemo(() => {
    return columns.concat([
      {
        key: 'op',
        minWidth: 70,
        name: 'operator',
        onRender(item) {
          return <MinusCircleOutlined style={{ marginLeft: '4px' }} onClick={removeReport(Number(item[0]))} />
        },
      },
    ])
  }, [removeReport])

  const callout = useMemo(() => {
    if (!reportIds.length) {
      return (
        <Stack styles={stackStyles} tokens={tokens}>
          Select two or more reports to compare.
        </Stack>
      )
    }

    const disabled = reportIds.length < 2 || reportIds.length > CompetitorMaxCount

    return (
      <Stack styles={stackStyles} tokens={tokens}>
        <CalloutHeader>Compare reports</CalloutHeader>
        {reportIds.length > 1 && <SelectMoreTip isError={false}>* The first report is baseline.</SelectMoreTip>}
        {reportIds.length < 2 && <SelectMoreTip>* Select one more report to compare.</SelectMoreTip>}
        <Table
          detailsListStyles={{
            root: {
              '.ms-DetailsHeader': { paddingTop: 0 },
            },
          }}
          items={Object.entries(projectReports)}
          selectionMode={SelectionMode.none}
          compact={true}
          columns={formatColumns}
        />
        <Stack horizontal horizontalAlign="end">
          <PrimaryButton styles={{ root: { height: '28px', padding: 0 } }} disabled={disabled} onClick={onClick}>
            <StartCompareButtonInner>
              <span>Compare</span>
              <DoubleRightOutlined />
            </StartCompareButtonInner>
          </PrimaryButton>
        </Stack>
      </Stack>
    )
  }, [reportIds.length, projectReports, onClick, formatColumns])

  return (
    <>
      <Container>
        <TeachingBubbleHost
          teachingId="lab-list-compare"
          headline="Compare Between Reports"
          delay={500}
          body={'Select two or more reports to compare. '}
          directional={DirectionalHint.topRightEdge}
        >
          <IconBox ref={iconRef} onMouseOver={showCallout}>
            <Badge count={badgeCount}>
              <StyledInboxOutlined />
            </Badge>
          </IconBox>
        </TeachingBubbleHost>
      </Container>
      {calloutVisible && (
        <Callout gapSpace={4} target={iconRef} onDismiss={hideCallout}>
          {callout}
        </Callout>
      )}
    </>
  )
}
