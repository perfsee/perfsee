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

import { Stack } from '@fluentui/react'
import { useModule } from '@sigi/react'
import { useEffect, useMemo } from 'react'

import { useWideScreen } from '@perfsee/components'

import { SnapshotDetailType } from '../../../snapshot-type'

import { CommitFlameGraph } from './commit-flame-graph'
import { ReactFlameGraphModule } from './module'
import { SidebarCommitInfo } from './sidebar-commit-info'
import { SidebarSelectedFiberInfo } from './sidebar-selected-info'
import { SnapshotSelector } from './snapshot-selector'
import { NoCommitData, NoCommitDataHeader, Container } from './styles'
import { getChartData, getCommitTree } from './util'

export interface Props {
  snapshot: SnapshotDetailType
}

export const PivotContentReact = ({ snapshot }: Props) => {
  const { reactProfileLink } = snapshot.report
  const [{ reactProfile, selectedCommitIndex, rootID, selectedFiberID }, dispatcher] = useModule(ReactFlameGraphModule)

  useWideScreen()

  useEffect(() => {
    reactProfileLink && dispatcher.fetchReactProfileData(reactProfileLink)
    return dispatcher.reset
  }, [dispatcher, reactProfileLink])

  const chartData = useMemo(() => {
    if (!reactProfile) {
      return null
    }
    try {
      const commitTree = getCommitTree({
        commitIndex: selectedCommitIndex,
        profilingData: reactProfile,
        rootID,
      })

      return getChartData({
        commitIndex: selectedCommitIndex,
        commitTree,
        profilingData: reactProfile,
        rootID,
      })
    } catch (e) {
      console.error(e)
      return null
    }
  }, [reactProfile, selectedCommitIndex, rootID])

  const sidebar = selectedFiberID ? <SidebarSelectedFiberInfo /> : <SidebarCommitInfo />

  if (chartData?.depth) {
    return (
      <Container>
        <Stack horizontal verticalFill>
          <Stack grow={4}>
            <SnapshotSelector />
            <CommitFlameGraph chartData={chartData} />
          </Stack>
          {sidebar}
        </Stack>
      </Container>
    )
  } else
    return (
      <NoCommitData>
        <NoCommitDataHeader>There is no commit data</NoCommitDataHeader>
      </NoCommitData>
    )
}
