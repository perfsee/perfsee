import { useModule, useModuleState } from '@sigi/react'
import { memo, MouseEvent, useCallback, useMemo } from 'react'

import { ElementTypeRoot } from './constant'
import { ReactFlameGraphModule } from './module'
import {
  CommitNoUpdaters,
  SidebarCommitDurationList,
  SidebarCommitDurationListItem,
  SidebarCommitLabel,
  SidebarCommitList,
  SidebarCommitListItem,
  SidebarContent,
  SidebarToolbar,
  CommitUpdater,
  CommitUpdaters,
  SidebarContainer,
} from './styles'
import { CommitTree, SerializedElement } from './types'
import { formatDuration, formatTime, getCommitTree } from './util'

export const SidebarCommitInfo = () => {
  const { reactProfile, selectedCommitIndex, rootID } = useModuleState(ReactFlameGraphModule)

  const {
    duration = 0,
    effectDuration = 0,
    passiveEffectDuration = 0,
    priorityLevel,
    timestamp = 0,
    updaters,
  } = reactProfile?.dataForRoots.get(rootID)?.commitData[selectedCommitIndex] || {}

  const hasCommitPhaseDurations = effectDuration !== null || passiveEffectDuration !== null

  const commitTree = useMemo(() => {
    return updaters !== null && reactProfile
      ? getCommitTree({
          commitIndex: selectedCommitIndex,
          profilingData: reactProfile,
          rootID,
        })
      : null
  }, [reactProfile, rootID, selectedCommitIndex, updaters])

  return (
    <SidebarContainer>
      <SidebarToolbar>Commit information</SidebarToolbar>
      <SidebarContent>
        <SidebarCommitList>
          {priorityLevel !== null && (
            <SidebarCommitListItem>
              <SidebarCommitLabel>Priority</SidebarCommitLabel>: <span>{priorityLevel}</span>
            </SidebarCommitListItem>
          )}
          <SidebarCommitListItem>
            <SidebarCommitLabel>Committed at</SidebarCommitLabel>: <span>{formatTime(timestamp)}s</span>
          </SidebarCommitListItem>

          {!hasCommitPhaseDurations && (
            <SidebarCommitListItem>
              <SidebarCommitLabel>Render duration</SidebarCommitLabel>: <span>{formatDuration(duration)}ms</span>
            </SidebarCommitListItem>
          )}

          {hasCommitPhaseDurations && (
            <SidebarCommitListItem>
              <SidebarCommitLabel>Durations</SidebarCommitLabel>
              <SidebarCommitDurationList>
                <SidebarCommitDurationListItem>
                  <SidebarCommitLabel>Render</SidebarCommitLabel>: <span>{formatDuration(duration)}ms</span>
                </SidebarCommitDurationListItem>
                {effectDuration !== null && (
                  <SidebarCommitDurationListItem>
                    <SidebarCommitLabel>Layout effects</SidebarCommitLabel>:{' '}
                    <span>{formatDuration(effectDuration)}ms</span>
                  </SidebarCommitDurationListItem>
                )}
                {passiveEffectDuration !== null && (
                  <SidebarCommitDurationListItem>
                    <SidebarCommitLabel>Passive effects</SidebarCommitLabel>:{' '}
                    <span>{formatDuration(passiveEffectDuration)}ms</span>
                  </SidebarCommitDurationListItem>
                )}
              </SidebarCommitDurationList>
            </SidebarCommitListItem>
          )}

          {updaters !== null && commitTree !== null && (
            <SidebarCommitListItem>
              <SidebarCommitLabel>What caused this update</SidebarCommitLabel>?
              <Updaters commitTree={commitTree} updaters={updaters} />
            </SidebarCommitListItem>
          )}
        </SidebarCommitList>
      </SidebarContent>
    </SidebarContainer>
  )
}

export interface UpdaterProps {
  commitTree: CommitTree
  updaters?: Array<SerializedElement>
}

const Updaters = memo(({ commitTree, updaters }: UpdaterProps) => {
  const [_state, dispatcher] = useModule(ReactFlameGraphModule)

  const onClick = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      const { id, displayname = null } = (e.target as HTMLButtonElement).dataset
      dispatcher.selectFiber({ id: id ? Number(id) : null, name: displayname })
    },
    [dispatcher],
  )

  const children = updaters?.length ? (
    updaters.map((serializedElement: SerializedElement) => {
      const { displayName, id, key, type } = serializedElement
      const isVisibleInTree = commitTree.nodes.has(id) && type !== ElementTypeRoot
      if (isVisibleInTree) {
        return (
          <CommitUpdater key={id} data-id={id} data-displayname={displayName} onClick={onClick}>
            {displayName} {key ? `key="${key}"` : ''}
          </CommitUpdater>
        )
      } else {
        return (
          <CommitNoUpdaters key={id}>
            {displayName} {key ? `key="${key}"` : ''}
          </CommitNoUpdaters>
        )
      }
    })
  ) : (
    <CommitNoUpdaters key="none">(unknown)</CommitNoUpdaters>
  )

  return <CommitUpdaters>{children}</CommitUpdaters>
})
