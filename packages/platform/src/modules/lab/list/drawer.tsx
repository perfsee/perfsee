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

import { EditOutlined, SaveOutlined } from '@ant-design/icons'
import { ITextField, Panel, PanelType, SharedColors, Stack, TextField } from '@fluentui/react'
import { useModule } from '@sigi/react'
import { noop } from 'lodash'
import { FC, useCallback, useRef, useState } from 'react'

import { useToggleState } from '@perfsee/components'
import { SnapshotStatus } from '@perfsee/schema'

import { ArtifactSelect, ArtifactSelectEventPayload } from '../../components'

import { LabListModule } from './module'
import { LabReportList } from './report-list'
import { SnapshotMeta } from './snapshot-meta'
import { SnapshotStatusTag } from './status-tag'
import { DrawerSetVersionButton, DrawerTitle } from './style'

type SnapshotDrawerProps = {
  visible: boolean
  snapshotId: number | null
  onClose: () => void
}

export const SnapshotDrawer: FC<SnapshotDrawerProps> = (props) => {
  const { snapshotId, visible } = props

  const [{ snapshot }, dispatcher] = useModule(LabListModule, {
    selector: (state) => ({
      snapshot: state.snapshots.find((item) => item.id === snapshotId),
    }),
    dependencies: [snapshotId],
  })

  const [artifactSelectVisible, showArtifactSelect, hideArtifactSelect] = useToggleState(false)
  const [editingTitle, setIsEditingTitle] = useState(false)
  const inputRef = useRef<ITextField>(null)

  const onEditTitle = useCallback(() => {
    setIsEditingTitle(true)
  }, [])

  const onSaveTitle = useCallback(() => {
    if (inputRef.current?.value && inputRef.current.value !== snapshot?.title) {
      dispatcher.setSnapshotTitle({ snapshotId: snapshot!.id, title: inputRef.current?.value })
    }
    setIsEditingTitle(false)
  }, [dispatcher, snapshot, inputRef])

  const onClose = useCallback(() => {
    props.onClose()
    setIsEditingTitle(false)
  }, [props])

  const onRenderHeader = useCallback(() => {
    if (!snapshot) {
      return null
    }

    return (
      <Stack grow={1} horizontal tokens={{ childrenGap: '16px', padding: '0 24px' }} verticalAlign="center">
        <SnapshotStatusTag status={snapshot.status as SnapshotStatus} />
        <DrawerTitle>
          {editingTitle ? (
            <Stack horizontal verticalAlign="center">
              <TextField
                defaultValue={snapshot.title}
                componentRef={inputRef}
                styles={{
                  root: { width: `${snapshot.title.length + 2}ch`, minWidth: 200, maxWidth: '100%', padding: 2 },
                }}
              />
              <SaveOutlined
                style={{
                  color: SharedColors.cyanBlue10,
                  cursor: 'pointer',
                  paddingLeft: '4px',
                  fontSize: 18,
                  marginLeft: 8,
                }}
                onClick={onSaveTitle}
              />
            </Stack>
          ) : (
            <Stack horizontal verticalAlign="center">
              {snapshot.title}
              <EditOutlined
                style={{
                  color: SharedColors.cyanBlue10,
                  cursor: 'pointer',
                  paddingLeft: '4px',
                  fontSize: 18,
                  marginLeft: 8,
                }}
                onClick={onEditTitle}
              />
            </Stack>
          )}
        </DrawerTitle>
      </Stack>
    )
  }, [snapshot, onEditTitle, editingTitle, onSaveTitle])

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
      {snapshot.status === SnapshotStatus.Completed && (
        <DrawerSetVersionButton onClick={showArtifactSelect}>Set Commit</DrawerSetVersionButton>
      )}
      <SnapshotMeta snapshot={snapshot} />
      <LabReportList onClose={onClose} snapshotId={snapshot.id} failedReason={snapshot.failedReason} />
      {artifactSelectVisible && <ArtifactSelect onSelect={onSelectArtifact} onDismiss={hideArtifactSelect} />}
    </Panel>
  )
}
