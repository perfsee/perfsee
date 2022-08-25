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

import { Spinner } from '@fluentui/react'
import { useModule } from '@sigi/react'
import { useCallback, useEffect } from 'react'
import { useParams } from 'react-router-dom'

import { ContentCard } from '@perfsee/components'

import { Breadcrumb } from '../components'
import { useBreadcrumb } from '../shared'

import { ReportContentWithRoute } from './components/snapshot-detail-content'
import { SnapshotHeader } from './components/snapshot-header'
import { SnapshotModule } from './snapshot.module'

export const SnapshotDetail = () => {
  const routerParams = useParams<{ reportId: string }>()
  const reportId = parseInt(routerParams.reportId)

  const [state, dispatcher] = useModule(SnapshotModule)

  const snapshotReport = state.snapshotReports[reportId]

  const snapshotId = snapshotReport?.snapshot.id
  const title = snapshotReport?.snapshot.title ?? `Snapshot #${snapshotId}`
  const breadcrumbItems = useBreadcrumb({ snapshotId })

  useEffect(() => {
    dispatcher.fetchSnapshotReport(reportId)
  }, [dispatcher, reportId])

  useEffect(() => {
    return dispatcher.reset
  }, [dispatcher])

  const onRenderHeader = useCallback(() => {
    if (!snapshotReport) {
      return null
    }

    return <SnapshotHeader snapshotTitle={title} report={snapshotReport} />
  }, [title, snapshotReport])

  if (state.reportLoading) {
    return <Spinner />
  }

  if (!snapshotReport) {
    return <div>Invalid report id</div>
  }

  return (
    <>
      <Breadcrumb items={breadcrumbItems} />
      <ContentCard onRenderHeader={onRenderHeader}>
        <ReportContentWithRoute snapshotReport={snapshotReport} />
      </ContentCard>
    </>
  )
}
