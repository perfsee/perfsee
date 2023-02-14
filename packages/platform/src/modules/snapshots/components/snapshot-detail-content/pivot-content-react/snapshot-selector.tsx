import { IconButton, Stack } from '@fluentui/react'
import { useModule } from '@sigi/react'
import { ChangeEvent, MouseEvent, useCallback, useMemo } from 'react'

import { ReactFlameGraphModule } from './module'
import { RootSelector } from './root-selector'
import { SnapshotCommitList } from './snapshot-commit-list'
import { SnapshotSelectorContainer, SnapshotSelectorInput } from './styles'

const iconLeft = { iconName: 'arrowLeft' }
const iconRight = { iconName: 'arrowRight' }
const commitsContainerTokens = { padding: '0 4px' }

export const SnapshotSelector = () => {
  const [{ reactProfile, selectedCommitIndex, rootID }, dispatcher] = useModule(ReactFlameGraphModule)
  const commitData = reactProfile?.dataForRoots[rootID]?.commitData

  const [commitTimes, totalDurations] = useMemo(() => {
    const totalDurations: Array<number> = []
    const commitTimes: number[] = []
    commitData?.forEach((commitDatum) => {
      totalDurations.push(
        commitDatum.duration + (commitDatum.effectDuration || 0) + (commitDatum.passiveEffectDuration || 0),
      )
      commitTimes.push(commitDatum.timestamp)
    })

    return [commitTimes, totalDurations]
  }, [commitData])

  const filteredCommitIndices = useMemo(
    () =>
      commitData?.reduce((reduced: number[], _commitDatum, index) => {
        reduced.push(index)
        return reduced
      }, []),
    [commitData],
  )

  const numFilteredCommits = filteredCommitIndices?.length ?? 0

  // Map the (unfiltered) selected commit index to an index within the filtered data.
  const selectedFilteredCommitIndex = useMemo(() => {
    if (selectedCommitIndex !== null && filteredCommitIndices) {
      for (let i = 0; i < filteredCommitIndices.length; i++) {
        if (filteredCommitIndices[i] === selectedCommitIndex) {
          return i
        }
      }
    }
    return 0
  }, [filteredCommitIndices, selectedCommitIndex])

  const handleCommitInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(event.currentTarget.value, 10)
      if (!isNaN(value)) {
        const filteredIndex = Math.min(
          Math.max(value - 1, 0),

          // Snashots are shown to the user as 1-based
          // but the indices within the profiler data array ar 0-based.
          numFilteredCommits - 1,
        )
        dispatcher.selectCommitIndex(filteredCommitIndices?.[filteredIndex] ?? 0)
      }
    },
    [dispatcher, filteredCommitIndices, numFilteredCommits],
  )

  const handleClick = useCallback((event: MouseEvent<HTMLInputElement>) => {
    event.currentTarget.select()
  }, [])

  const label = (
    <>
      <SnapshotSelectorInput
        data-testname="SnapshotSelector-Input"
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={selectedFilteredCommitIndex + 1}
        size={`${numFilteredCommits}`.length}
        onChange={handleCommitInputChange}
        onClick={handleClick}
      />{' '}
      / {numFilteredCommits}
    </>
  )

  const viewNextCommit = useCallback(() => {
    let nextCommitIndex = selectedFilteredCommitIndex + 1
    if (nextCommitIndex === filteredCommitIndices?.length) {
      nextCommitIndex = 0
    }
    dispatcher.selectCommitIndex(filteredCommitIndices?.[nextCommitIndex] ?? 0)
  }, [dispatcher, selectedFilteredCommitIndex, filteredCommitIndices])

  const viewPrevCommit = useCallback(() => {
    let nextCommitIndex = selectedFilteredCommitIndex - 1
    if (nextCommitIndex < 0) {
      nextCommitIndex = filteredCommitIndices?.length ?? 0 - 1
    }
    dispatcher.selectCommitIndex(filteredCommitIndices?.[nextCommitIndex] ?? 0)
  }, [dispatcher, selectedFilteredCommitIndex, filteredCommitIndices])

  if (!commitData || commitData?.length === 0) {
    return null
  }

  return (
    <SnapshotSelectorContainer horizontal horizontalAlign="end" verticalAlign="center">
      <RootSelector />
      <span>{label}</span>
      <IconButton iconProps={iconLeft} disabled={numFilteredCommits === 0} onClick={viewPrevCommit} />
      <Stack tokens={commitsContainerTokens}>
        {numFilteredCommits > 0 && (
          <SnapshotCommitList
            commitData={commitData}
            commitTimes={commitTimes || []}
            filteredCommitIndices={filteredCommitIndices || []}
            selectedCommitIndex={selectedCommitIndex}
            selectedFilteredCommitIndex={selectedFilteredCommitIndex}
            selectCommitIndex={dispatcher.selectCommitIndex}
            totalDurations={totalDurations}
            height={35}
            width={numFilteredCommits * 25}
          />
        )}
        {numFilteredCommits === 0 && <div>No commits</div>}
      </Stack>
      <IconButton iconProps={iconRight} disabled={numFilteredCommits === 0} onClick={viewNextCommit} />
    </SnapshotSelectorContainer>
  )
}
