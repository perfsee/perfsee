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

import styled from '@emotion/styled'
import { useCallback, useState } from 'react'

import { OverviewZoneContent, OverviewZoneTitle } from '@perfsee/lab-report/pivot-content-overview/style'
import { PerformanceContent } from '@perfsee/lab-report/pivot-content-performance'
import { AnalysisReportTabType, SnapshotDetailType } from '@perfsee/lab-report/snapshot-type'

import { OverviewPivotContent } from '../pivot-content-overview'

import { UserFlowNavigation } from './user-flow-navigation'

type Props = {
  snapshot: SnapshotDetailType
}

const ContentContainer = styled.div({
  padding: '0 20px',
})

export const UserFlowPivotContent = (props: Props) => {
  const [currentStep, setCurrentStep] = useState(0)

  const handleClickStep = useCallback((stepIndex: number) => {
    setCurrentStep(stepIndex)
  }, [])

  if (!props.snapshot.userFlow) {
    return <>no data</>
  }

  return (
    <>
      <UserFlowNavigation
        steps={props.snapshot.userFlow}
        currentStepIndex={currentStep}
        onStepClick={handleClickStep}
      />
      <ContentContainer>
        <OverviewPivotContent snapshot={props.snapshot.userFlow[currentStep]} />
        <OverviewZoneTitle style={{ marginTop: '24px' }}>Performance Analysis</OverviewZoneTitle>
        <OverviewZoneContent bordered={true} padding={false}>
          <PerformanceContent
            hideBorder={true}
            type={AnalysisReportTabType.Performance}
            snapshot={props.snapshot.userFlow[currentStep]}
          />
        </OverviewZoneContent>
      </ContentContainer>
    </>
  )
}
