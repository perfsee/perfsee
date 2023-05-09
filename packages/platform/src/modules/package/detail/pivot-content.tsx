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

import { Pivot, PivotItem, MessageBarType, Stack, Shimmer } from '@fluentui/react'
import { useModule } from '@sigi/react'
import { parse, stringify } from 'query-string'
import { useCallback, FC, memo } from 'react'
import { useHistory, useLocation } from 'react-router-dom'

import { MessageBar } from '@perfsee/components'
import { BundleJobStatus } from '@perfsee/schema'

import { PackageBundleDetailModule } from './module'
import { BenchmarkDetail } from './pivot-content-benchmark'
import { DependenciesDetail } from './pivot-content-dependencies'
import { PackageBundleReports } from './pivot-content-overview'

export const enum PackageDetailTabName {
  Overview = 'overview',
  Benchmark = 'benchmark',
  Dependencies = 'dependencies',
}

export const OverviewTab = {
  id: 'overview',
  title: 'Overview',
}

export const DependenciesTab = {
  id: 'dependencies',
  title: 'Dependencies',
}

export const BenchmarkTab = {
  id: 'benchmark',
  title: 'Benchmark',
}

type PivotContentProps = {
  packageId: string
  packageBundleId: string
  projectId: string
  type: PackageDetailTabName
}

export const PivotContent = (props: PivotContentProps) => {
  const { type } = props

  switch (type) {
    case 'overview':
      return <PackageBundleReports {...props} />
    case 'benchmark':
      return <BenchmarkDetail {...props} />
    case 'dependencies':
      return <DependenciesDetail />
    default:
      return null
  }
}

interface Props {
  packageId: string
  packageBundleId: string
  projectId: string
}
export const ReportContentWithRoute: FC<Props> = memo((props) => {
  const history = useHistory()
  const location = useLocation()
  const queries: { tab?: string } = parse(location.search)

  const onLinkClick = useCallback(
    (item?: PivotItem) => {
      if (!item) {
        return
      }

      if (queries.tab !== item.props.itemKey) {
        history.push(`${location.pathname}?${stringify({ ...queries, tab: item.props.itemKey })}`)
      }
    },
    [history, location.pathname, queries],
  )

  return (
    <ReportContent
      tabName={(queries.tab as PackageDetailTabName) ?? PackageDetailTabName.Overview}
      onLinkClick={onLinkClick}
      {...props}
    />
  )
})

type ReportContentProps = {
  tabName: PackageDetailTabName
  onLinkClick: (item?: PivotItem) => void
  packageId: string
  packageBundleId: string
  projectId: string
}

const overviewPivot = <PivotItem itemKey={OverviewTab.id} key={OverviewTab.id} headerText={OverviewTab.title} />
const benchmarkPivot = <PivotItem itemKey={BenchmarkTab.id} key={BenchmarkTab.id} headerText={BenchmarkTab.title} />

export const ReportContent: FC<ReportContentProps> = (props) => {
  const { tabName, onLinkClick } = props

  const [state] = useModule(PackageBundleDetailModule)

  if (state.loading || !state.current) {
    return <Shimmer />
  }

  if (state.current.status !== BundleJobStatus.Passed) {
    return (
      <Stack horizontalAlign="center">{renderMessageBar(state.current.status, state.current.failedReason ?? '')}</Stack>
    )
  }

  const dependenciesPivot = state.current.report?.packageJson.dependencies ? (
    <PivotItem
      itemKey={DependenciesTab.id}
      key={DependenciesTab.id}
      headerText={`${Object.keys(state.current.report.packageJson.dependencies).length} ` + DependenciesTab.title}
    />
  ) : null

  return (
    <div>
      <Pivot styles={{ root: { marginBottom: '16px' } }} selectedKey={tabName} onLinkClick={onLinkClick}>
        {overviewPivot}
        {state.current.benchmarkLink ? benchmarkPivot : undefined}
        {dependenciesPivot}
      </Pivot>
      <PivotContent {...props} type={tabName} />
    </div>
  )
}

const renderMessageBar = (status: BundleJobStatus, reason?: string) => {
  const type =
    status === BundleJobStatus.Pending
      ? MessageBarType.severeWarning
      : status === BundleJobStatus.Failed
      ? MessageBarType.error
      : status === BundleJobStatus.Running
      ? MessageBarType.warning
      : MessageBarType.info

  return <MessageBar messageBarType={type}>{reason ? reason : `Snapshot is ${status}`}</MessageBar>
}
