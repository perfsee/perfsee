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
import { Callout, Stack, TooltipHost, PrimaryButton, DirectionalHint } from '@fluentui/react'
import { useModule } from '@sigi/react'
import { stringifyUrl } from 'query-string'
import { useCallback, useMemo, useRef } from 'react'
import { useHistory } from 'react-router-dom'

import { Badge, TeachingBubbleHost, TooltipWithEllipsis } from '@perfsee/components'
import { pathFactory } from '@perfsee/shared/routes'

import { CompareModule, CompetitorMaxCount, useProject } from '../../shared'
import { PerformanceTabType } from '../../snapshots/snapshot-type'

import {
  CalloutHeader,
  Container,
  IconBox,
  SnapshotName,
  SelectMoreTip,
  PageName,
  StartCompareButtonInner,
  StyledInboxOutlined,
} from './style'

const tokens = { childrenGap: 10, padding: '16px' }
const stackStyles = { root: { maxWidth: '400px', minWidth: '200px' } }

export const ComparisonBox = () => {
  const history = useHistory()
  const project = useProject()

  const iconRef = useRef<HTMLDivElement>(null)

  const [{ compareReports, calloutVisible }, dispatcher] = useModule(CompareModule)

  const projectReports = useMemo(() => (project ? compareReports[project.id] ?? {} : {}), [compareReports, project])

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

  const callout = useMemo(() => {
    if (!reportIds.length) {
      return (
        <Stack styles={stackStyles} tokens={tokens}>
          Select two or more reports to compare. [Hover the page name under the snapshot and then click the plus
          button].
        </Stack>
      )
    }

    const disabled = reportIds.length < 2 || reportIds.length > CompetitorMaxCount
    return (
      <Stack styles={stackStyles} tokens={tokens}>
        <CalloutHeader>Compare reports</CalloutHeader>
        {reportIds.length < 2 && <SelectMoreTip>* Select one more report to compare</SelectMoreTip>}
        {Object.keys(projectReports).map((reportId) => {
          const data = projectReports[reportId]

          return (
            <Stack
              key={reportId}
              tokens={{ childrenGap: '6px' }}
              horizontal
              verticalAlign="center"
              horizontalAlign="space-between"
            >
              <TooltipWithEllipsis content={data.name}>
                <PageName>{data.name} </PageName>
              </TooltipWithEllipsis>
              <Stack
                styles={{ root: { minWidth: '100px' } }}
                tokens={{ childrenGap: '6px' }}
                horizontal
                verticalAlign="center"
              >
                <SnapshotName>Snapshot #{data.snapshotId}</SnapshotName>
                <MinusCircleOutlined style={{ marginLeft: '4px' }} onClick={removeReport(Number(reportId))} />
              </Stack>
            </Stack>
          )
        })}
        <Stack horizontal horizontalAlign="end">
          <TooltipHost hidden={!disabled} content="Select 2 ~ 5 reports to be compared.">
            <PrimaryButton styles={{ root: { height: '28px', padding: 0 } }} disabled={disabled} onClick={onClick}>
              <StartCompareButtonInner>
                <span>Compare</span>
                <DoubleRightOutlined />
              </StartCompareButtonInner>
            </PrimaryButton>
          </TooltipHost>
        </Stack>
      </Stack>
    )
  }, [reportIds.length, projectReports, onClick, removeReport])

  return (
    <>
      <Container>
        <TeachingBubbleHost
          teachingId="lab-list-compare"
          headline="Compare Between Reports"
          delay={500}
          body={
            <>
              Select two or more reports to compare. <br />
              [Hover the page name under the snapshot and then click the plus button].
            </>
          }
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
