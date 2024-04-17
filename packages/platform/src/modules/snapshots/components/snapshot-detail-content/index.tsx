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

import { FullscreenOutlined, InfoCircleOutlined } from '@ant-design/icons'
import {
  Pivot,
  PivotItem,
  MessageBarType,
  Stack,
  TooltipHost,
  SharedColors,
  IButtonProps,
  DefaultButton,
} from '@fluentui/react'
import { useModule } from '@sigi/react'
import { parse, stringifyUrl } from 'query-string'
import { useMemo, useCallback, FC, useEffect, memo } from 'react'
import { useParams, useHistory } from 'react-router-dom'

import { ForeignLink, MessageBar } from '@perfsee/components'
import { PerformanceTabType, SnapshotReportSchema } from '@perfsee/lab-report/snapshot-type'
import { LighthouseBrand } from '@perfsee/lab-report/style'
import { getReportMessage, useProject } from '@perfsee/platform/modules/shared'
import { SnapshotStatus, SourceStatus } from '@perfsee/schema'
import { pathFactory } from '@perfsee/shared/routes'

import { SnapshotModule } from '../../snapshot.module'
import {
  OverviewTab,
  AssetTab,
  BreakdownTab,
  FlamechartTab,
  SourceCoverageTab,
  ReactTab,
  SourceStatisticsTab,
  LogTab,
} from '../../utils/format-lighthouse'
import { LoadingShimmer } from '../loading-shimmer'

import { PivotContent, MultiReportPivotContent } from './pivot-content'

type Props = {
  snapshotReport: SnapshotReportSchema
  isUserFlow?: boolean
}

export const ReportContentWithRoute: FC<Props> = memo((props) => {
  const history = useHistory()
  const project = useProject()
  const routerParams = useParams<{
    reportId: string
    tabName: string
  }>()

  const report = props.snapshotReport

  const onLinkClick = useCallback(
    (item?: PivotItem) => {
      const query = parse(history.location.search)

      history.push(
        stringifyUrl({
          url: pathFactory.project.lab.report({
            ...routerParams,
            projectId: project!.id,
            tabName: item?.props.itemKey ?? OverviewTab.id,
          }),
          query,
        }),
      )
    },
    [history, routerParams, project],
  )

  if (![SnapshotStatus.Completed, SnapshotStatus.PartialCompleted].includes(report.status)) {
    return <Stack horizontalAlign="center">{renderMessageBar(report.status, getReportMessage(report))}</Stack>
  }

  return (
    <>
      {report.status === SnapshotStatus.PartialCompleted
        ? renderMessageBar(report.status, getReportMessage(report))
        : null}
      <ReportContent
        snapshotReports={[report]}
        tabName={routerParams.tabName as PerformanceTabType}
        onLinkClick={onLinkClick}
        isUserFlow={props.isUserFlow}
      />
    </>
  )
})

type ReportContentProps = {
  snapshotReports: SnapshotReportSchema[]
  tabName: PerformanceTabType
  onLinkClick: (item?: PivotItem) => void
  isUserFlow?: boolean
}

const sourceLoadingProps: IButtonProps = {
  disabled: true,
  iconProps: { iconName: 'loading', styles: { root: { color: SharedColors.green10 } } },
  onRenderIcon: (p, d) => (
    <TooltipHost content="Generating... Check out the 'source' tab to learn more.">{d?.(p)}</TooltipHost>
  ),
}

const overviewPivot = <PivotItem itemKey={OverviewTab.id} key={OverviewTab.id} headerText={OverviewTab.title} />
const breakdownPivot = <PivotItem itemKey={BreakdownTab.id} key={BreakdownTab.id} headerText={BreakdownTab.title} />
const assetPivot = <PivotItem itemKey={AssetTab.id} key={AssetTab.id} headerText={AssetTab.title} />
const flamechartPivot = <PivotItem itemKey={FlamechartTab.id} key={FlamechartTab.id} headerText={FlamechartTab.title} />
const flamechartLoadingPivot = (
  <PivotItem
    itemKey={FlamechartTab.id}
    key={FlamechartTab.id}
    headerText={FlamechartTab.title}
    headerButtonProps={sourceLoadingProps}
  />
)
const sourceCoveragePivot = (
  <PivotItem itemKey={SourceCoverageTab.id} key={SourceCoverageTab.id} headerText={SourceCoverageTab.title} />
)
const reactPivot = <PivotItem itemKey={ReactTab.id} key={ReactTab.id} headerText={ReactTab.title} />
const logPivot = <PivotItem itemKey={LogTab.id} key={LogTab.id} headerText={LogTab.title} />
const sourceCoverageLoadingPivot = (
  <PivotItem
    itemKey={SourceCoverageTab.id}
    key={SourceCoverageTab.id}
    headerText={SourceCoverageTab.title}
    headerButtonProps={sourceLoadingProps}
  />
)
const sourceStatisticsPivot = (
  <PivotItem itemKey={SourceStatisticsTab.id} key={SourceStatisticsTab.id} headerText={SourceStatisticsTab.title} />
)
const onClickFullScreen = () => {
  const elem = document.querySelector('#full-screen-elem')
  if (elem) {
    void elem.requestFullscreen()
  }
}
const fullScreenButton = (
  <DefaultButton styles={{ label: { fontWeight: 400 }, root: { whiteSpace: 'pre' } }} onClick={onClickFullScreen}>
    <FullscreenOutlined /> Full Screen
  </DefaultButton>
)

export const ReportContent: FC<ReportContentProps> = (props) => {
  const { tabName, snapshotReports, onLinkClick } = props

  const [state, dispatcher] = useModule(SnapshotModule)

  useEffect(() => {
    dispatcher.fetchReportsDetail(snapshotReports)
  }, [dispatcher, snapshotReports])

  const completedReports = useMemo(() => {
    return snapshotReports.filter(
      (v) => [SnapshotStatus.Completed, SnapshotStatus.PartialCompleted].includes(v.status) && v.reportLink,
    )
  }, [snapshotReports])

  if (state.detailLoading) {
    return <LoadingShimmer />
  }

  if (!completedReports.length) {
    return <MessageBar>No Data</MessageBar>
  } else if (completedReports.length === 1) {
    const report = completedReports[0]
    if (!state.snapshotReportsDetail[report.reportLink!]) {
      return <LoadingShimmer />
    }

    const detail = { ...state.snapshotReportsDetail[report.reportLink!], report }

    const sourceOnGoing = report.sourceStatus === SourceStatus.Running || report.sourceStatus === SourceStatus.Pending

    return (
      <div>
        <Stack horizontal verticalAlign="baseline" horizontalAlign="space-between">
          <Pivot styles={{ root: { marginBottom: '16px' } }} selectedKey={tabName} onLinkClick={onLinkClick}>
            {overviewPivot}
            {assetPivot}
            {sourceStatisticsPivot}
            {report.flameChartLink ? flamechartPivot : sourceOnGoing ? flamechartLoadingPivot : undefined}
            {report.sourceCoverageLink ? sourceCoveragePivot : sourceOnGoing ? sourceCoverageLoadingPivot : undefined}
            {report.reactProfileLink ? reactPivot : undefined}
            {props.isUserFlow ? null : logPivot}
          </Pivot>
          {tabName === FlamechartTab.id ? fullScreenButton : null}
        </Stack>
        <PivotContent snapshot={detail} type={tabName} />
        <LighthouseBrand tokens={{ childrenGap: 8 }} horizontal horizontalAlign="center" verticalAlign="center">
          <InfoCircleOutlined />
          <p>
            Portions of this report use Lighthouse. For more information visit{' '}
            <ForeignLink href="https://developer.chrome.com/docs/lighthouse/overview/">here</ForeignLink>.
          </p>
        </LighthouseBrand>
      </div>
    )
  } else {
    const details = completedReports.map((report) => ({
      ...state.snapshotReportsDetail[report.reportLink!],
      report,
    }))

    return (
      <div>
        <Pivot styles={{ root: { marginBottom: '16px' } }} selectedKey={tabName} onLinkClick={onLinkClick}>
          {overviewPivot}
          {breakdownPivot}
        </Pivot>
        <MultiReportPivotContent snapshots={details} type={tabName} />
      </div>
    )
  }
}

const renderMessageBar = (status: SnapshotStatus, reason?: string) => {
  const type =
    status === SnapshotStatus.Pending
      ? MessageBarType.severeWarning
      : status === SnapshotStatus.Failed
      ? MessageBarType.error
      : status === SnapshotStatus.Running
      ? MessageBarType.warning
      : MessageBarType.info

  return <MessageBar messageBarType={type}>{reason ? reason : `Snapshot is ${status}`}</MessageBar>
}
