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
import { useCallback, useEffect, useMemo } from 'react'

import { useWideScreen } from '@perfsee/components'
import {
  buildProfilesFromReactDevtoolExportProfileData,
  FlamechartReactDevtoolProfileContainer,
} from '@perfsee/flamechart'

import { SnapshotDetailType } from '../../../snapshot-type'

import { ReactFlameGraphModule } from './module'
import { SidebarCommitInfo } from './sidebar-commit-info'
import { SidebarSelectedFiberInfo } from './sidebar-selected-info'
import { SnapshotSelector } from './snapshot-selector'
import { NoCommitData, NoCommitDataHeader, Container } from './styles'

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

  const reactProfiles = useMemo(() => {
    if (!reactProfile) {
      return null
    }
    return buildProfilesFromReactDevtoolExportProfileData(reactProfile)
  }, [reactProfile])

  const handleSelectFiber = useCallback(
    (fiber: { id: number; name: string } | null) => {
      dispatcher.selectFiber({ id: fiber?.id || null, name: fiber?.name || null })
    },
    [dispatcher],
  )

  const sidebar = selectedFiberID ? <SidebarSelectedFiberInfo /> : <SidebarCommitInfo />

  if (reactProfiles) {
    return (
      <Container>
        <Stack horizontal verticalFill>
          <Stack grow={4}>
            <SnapshotSelector />
            <div style={{ width: '100%', height: '100%' }}>
              <FlamechartReactDevtoolProfileContainer
                profile={reactProfiles[rootID][selectedCommitIndex]}
                onSelectFiber={handleSelectFiber}
              />
            </div>
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
