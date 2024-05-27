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
import { memo, useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import { ContentCard } from '@perfsee/components'
import { UserFlowNavigation } from '@perfsee/lab-report'

import { ReportContentWithRoute } from './components/snapshot-detail-content'
import { SnapshotHeader } from './components/snapshot-header'
import { SnapshotModule } from './snapshot.module'

export const SnapshotDetail = memo(() => {
  const routerParams = useParams<{ reportId: string }>()
  const reportId = parseInt(routerParams.reportId)

  const [state, dispatcher] = useModule(SnapshotModule)

  const [stepReportId, setStepReportId] = useState(reportId)
  const [currentStep, setCurrentStep] = useState(0)
  const handleClickStep = useCallback((stepIndex: number, reportId: number) => {
    setCurrentStep(stepIndex)
    setStepReportId(reportId)
  }, [])

  const snapshotReport = state.snapshotReports[reportId]
  const detail = state.snapshotReportsDetail[snapshotReport?.reportLink ?? '']
  const userflowNavigation =
    detail?.userFlow?.length && detail.userFlow.length > 1 ? (
      <UserFlowNavigation currentStepIndex={currentStep} onStepClick={handleClickStep} steps={detail.userFlow} />
    ) : null

  const stepSnapshotReport = state.snapshotReports[stepReportId]

  const snapshotId = stepSnapshotReport?.snapshot.id
  const title = stepSnapshotReport?.snapshot.title ?? `Snapshot #${snapshotId}`

  useEffect(() => {
    setStepReportId(reportId)
  }, [reportId])

  useEffect(() => {
    dispatcher.fetchSnapshotReport(stepReportId)
  }, [dispatcher, stepReportId])

  useEffect(() => {
    return dispatcher.reset
  }, [dispatcher])

  const onRenderHeader = useCallback(() => {
    if (!stepSnapshotReport) {
      return null
    }

    return <SnapshotHeader snapshotTitle={title} report={stepSnapshotReport} />
  }, [title, stepSnapshotReport])

  if (state.reportLoading) {
    return <Spinner />
  }

  if (!stepSnapshotReport) {
    return <div>Invalid report id</div>
  }

  return (
    <ContentCard onRenderHeader={onRenderHeader}>
      {userflowNavigation}
      <ReportContentWithRoute
        snapshotReport={stepSnapshotReport}
        key={stepReportId}
        isUserFlow={!!detail?.userFlow?.length}
      />
    </ContentCard>
  )
})
