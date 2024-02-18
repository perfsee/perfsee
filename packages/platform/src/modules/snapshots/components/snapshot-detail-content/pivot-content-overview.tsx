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

import { useCallback } from 'react'
import { useHistory, useParams } from 'react-router'

import { OverviewPivotContent as Overview } from '@perfsee/lab-report/pivot-content-overview'
import { SnapshotDetailType, SnapshotUserFlowDetailType } from '@perfsee/lab-report/snapshot-type'
import { RouteTypes, pathFactory } from '@perfsee/shared/routes'

type Props = {
  snapshot: SnapshotDetailType | SnapshotUserFlowDetailType
}

export const OverviewPivotContent = (props: Props) => {
  const { projectId, reportId } = useParams<RouteTypes['project']['lab']['report']>()
  const history = useHistory()

  const goToFlamechart = useCallback(() => {
    history.push(pathFactory.project.lab.report({ projectId, reportId, tabName: 'flamechart' }))
  }, [history, projectId, reportId])

  const goToAssets = useCallback(() => {
    history.push(pathFactory.project.lab.report({ projectId, reportId, tabName: 'asset' }))
  }, [history, projectId, reportId])

  return <Overview snapshot={props.snapshot} goToAssets={goToAssets} goToFlamechart={goToFlamechart} />
}
