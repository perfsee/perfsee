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

import { Panel, PanelType, Stack } from '@fluentui/react'
import { useModule } from '@sigi/react'
import { noop } from 'lodash'
import { FC, useCallback } from 'react'

import { useToggleState } from '@perfsee/components'
import { SnapshotStatus } from '@perfsee/schema'

import { ArtifactSelect, ArtifactSelectEventPayload } from '../../components'

import { LabListModule } from './module'
import { LabReportList } from './report-list'
import { SnapshotMeta } from './snapshot-meta'
import { SnapshotStatusTag } from './status-tag'
import { DrawerArtifactSelectWarning, DrawerSetVersionButton, DrawerTitle } from './style'

type SnapshotDrawerProps = {
  visible: boolean
  snapshotId: number | null
  onClose: () => void
}

export const SnapshotDrawer: FC<SnapshotDrawerProps> = (props) => {
  const { snapshotId, visible, onClose } = props

  const [{ snapshot }, dispatcher] = useModule(LabListModule, {
    selector: (state) => ({
      snapshot: state.snapshots.find((item) => item.id === snapshotId),
    }),
    dependencies: [snapshotId],
  })

  const [artifactSelectVisible, showArtifactSelect, hideArtifactSelect] = useToggleState(false)

  const onRenderHeader = useCallback(() => {
    if (!snapshot) {
      return null
    }

    return (
      <Stack grow={1} horizontal tokens={{ childrenGap: '16px', padding: '0 24px' }} verticalAlign="center">
        <SnapshotStatusTag status={snapshot.status as SnapshotStatus} />
        <DrawerTitle>{snapshot.title}</DrawerTitle>
      </Stack>
    )
  }, [snapshot])

  const onSelectArtifact = useCallback(
    (payload: ArtifactSelectEventPayload) => {
      dispatcher.setSnapshotHash({ snapshotId: snapshot!.id, hash: payload.artifact.hash })
      hideArtifactSelect()
    },
    [dispatcher, hideArtifactSelect, snapshot],
  )

  if (!snapshot) {
    return null
  }

  return (
    <Panel
      type={PanelType.largeFixed}
      isOpen={visible}
      overlayProps={{ onClick: onClose }}
      onDismiss={onClose}
      onOuterClick={noop}
      onRenderHeader={onRenderHeader}
    >
      {snapshot.status === SnapshotStatus.Completed && typeof snapshot.hash !== 'string' && (
        <DrawerSetVersionButton onClick={showArtifactSelect}>Set Commit</DrawerSetVersionButton>
      )}
      <SnapshotMeta snapshot={snapshot} />
      <LabReportList onClose={onClose} snapshotId={snapshot.id} failedReason={snapshot.failedReason} />
      {artifactSelectVisible && (
        <ArtifactSelect
          description={
            <DrawerArtifactSelectWarning>
              Commit hash can only set once and can't be modified!
            </DrawerArtifactSelectWarning>
          }
          onSelect={onSelectArtifact}
          onDismiss={hideArtifactSelect}
        />
      )}
    </Panel>
  )
}
