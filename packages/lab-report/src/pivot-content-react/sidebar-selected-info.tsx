import { IconButton } from '@fluentui/react'
import { useModule } from '@sigi/react'
import { MouseEvent, ReactNode, useCallback, useEffect, useMemo, useRef } from 'react'

import { ReactFlameGraphModule } from './module'
import {
  SidebarToolbar,
  SidebarSelectedComponent,
  SidebarContent,
  SidebarSelectedLabel,
  SidebarContainer,
  RenderedCommit,
} from './styles'
import { formatDuration, formatTime } from './util'
import { WhatChanged } from './what-changed'

export const SidebarSelectedFiberInfo = () => {
  const [{ reactProfile, selectedCommitIndex, selectedFiberID, rootID, selectedFiberName }, dispatcher] =
    useModule(ReactFlameGraphModule)
  const selectedListItemRef = useRef<HTMLButtonElement>(null)

  const commitIndices = useMemo(() => {
    const fiberCommits: number[] = []
    const dataForRoot = reactProfile?.dataForRoots.get(rootID)
    dataForRoot?.commitData.forEach((commitDatum, commitIndex) => {
      if (selectedFiberID && commitDatum.fiberActualDurations.has(selectedFiberID)) {
        fiberCommits.push(commitIndex)
      }
    })
    return fiberCommits
  }, [reactProfile, selectedFiberID, rootID])

  useEffect(() => {
    const selectedElement = selectedListItemRef.current
    if (selectedElement !== null && typeof selectedElement.scrollIntoView === 'function') {
      selectedElement.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    }
  }, [selectedCommitIndex, selectedListItemRef])

  const onClick = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      const commitIndex = Number((e.target as HTMLButtonElement).dataset.commitindex ?? 0)
      dispatcher.selectCommitIndex(commitIndex)
    },
    [dispatcher],
  )

  const listItems = useMemo(() => {
    const listItems: ReactNode[] = []
    let i = 0
    for (i = 0; i < commitIndices.length; i++) {
      const commitIndex = commitIndices[i]

      const { duration, timestamp } = reactProfile?.dataForRoots.get(rootID)?.commitData?.[commitIndex] ?? {}

      listItems.push(
        <RenderedCommit
          key={commitIndex}
          data-commitindex={commitIndex}
          ref={selectedCommitIndex === commitIndex ? selectedListItemRef : null}
          className={selectedCommitIndex === commitIndex ? 'current' : ''}
          onClick={onClick}
        >
          {formatTime(timestamp ?? 0)}s for {formatDuration(duration ?? 0)}ms
        </RenderedCommit>,
      )
    }

    return listItems
  }, [reactProfile, commitIndices, rootID, selectedCommitIndex, selectedListItemRef, onClick])

  const onClose = useCallback(() => {
    dispatcher.selectFiber({ id: null, name: null })
  }, [dispatcher])

  return (
    <SidebarContainer>
      <SidebarToolbar>
        <SidebarSelectedComponent>{selectedFiberName || 'Selected component'}</SidebarSelectedComponent>
        <IconButton iconProps={{ iconName: 'clear' }} onClick={onClose} />
      </SidebarToolbar>
      <SidebarContent>
        <WhatChanged fiberID={selectedFiberID!} />
        {listItems.length > 0 && (
          <>
            <SidebarSelectedLabel>Rendered at:</SidebarSelectedLabel> {listItems}
          </>
        )}
        {listItems.length === 0 && <div>Did not render during this profiling session.</div>}
      </SidebarContent>
    </SidebarContainer>
  )
}
