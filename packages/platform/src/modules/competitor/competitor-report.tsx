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

import { PivotItem, MessageBar, MessageBarType } from '@fluentui/react'
import { useModule, useDispatchers } from '@sigi/react'
import { parse } from 'query-string'
import { useEffect, useMemo, useCallback } from 'react'
import { useHistory, useParams } from 'react-router-dom'

import { ContentCard } from '@perfsee/components'
import { PerformanceTabType } from '@perfsee/lab-report/snapshot-type'
import { pathFactory } from '@perfsee/shared/routes'

import { PropertyModule, CompetitorMaxCount, useProjectRouteGenerator } from '../shared'
import { LoadingShimmer } from '../snapshots/components/loading-shimmer'
import { ReportContent } from '../snapshots/components/snapshot-detail-content'
import { SnapshotModule } from '../snapshots/snapshot.module'

export const CompetitorReport = () => {
  const history = useHistory()
  const routerParams = useParams<{ tabName: string }>()
  const generateProjectRoute = useProjectRouteGenerator()

  const [{ snapshotReports }, dispatcher] = useModule(SnapshotModule)
  const { fetchProperty } = useDispatchers(PropertyModule)

  useEffect(() => {
    fetchProperty()
  }, [fetchProperty])

  const reportIds = useMemo(() => {
    const query = parse(history.location.search, { arrayFormat: 'comma', parseNumbers: true })
    const ids = query['report_ids']

    return typeof ids === 'number' ? [ids] : (ids as number[]) ?? []
  }, [history.location.search])

  const onLinkClick = useCallback(
    (item?: PivotItem) => {
      if (!item?.props.itemKey) {
        return null
      }

      const link = generateProjectRoute(
        pathFactory.project.competitor.report,
        { tabName: item.props.itemKey },
        { report_ids: reportIds.join(',') },
      )
      history.push(link)
    },
    [generateProjectRoute, history, reportIds],
  )

  useEffect(() => {
    if (reportIds.length && reportIds.length <= CompetitorMaxCount) {
      dispatcher.fetchSnapshotReports(reportIds)
    }

    return dispatcher.reset
  }, [dispatcher, reportIds])

  const reports = useMemo(() => {
    return reportIds.map((id) => snapshotReports[id]).filter((v) => !!v)
  }, [reportIds, snapshotReports])

  if (reportIds.length > CompetitorMaxCount) {
    return (
      <MessageBar messageBarType={MessageBarType.warning}>
        Up to {CompetitorMaxCount} reports can only be compared.
      </MessageBar>
    )
  }

  return (
    <ContentCard>
      {reports.length !== reportIds.length ? (
        <LoadingShimmer />
      ) : (
        <ReportContent
          tabName={routerParams.tabName as PerformanceTabType}
          snapshotReports={reports}
          onLinkClick={onLinkClick}
        />
      )}
    </ContentCard>
  )
}
