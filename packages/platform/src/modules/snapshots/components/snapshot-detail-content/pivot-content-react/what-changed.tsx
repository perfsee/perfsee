import { useModuleState } from '@sigi/react'
import { memo, useMemo } from 'react'

import { ReactFlameGraphModule } from './module'
import { WhatChangedComponent, WhatChangedItem, WhatChangedKey, WhatChangedLabel } from './styles'

function hookIndicesToString(indices: Array<number>): string {
  // This is debatable but I think 1-based might ake for a nicer UX.
  const numbers = indices.map((value) => value + 1)

  switch (numbers.length) {
    case 0:
      return 'No hooks changed'
    case 1:
      return `Hook ${numbers[0]} changed`
    case 2:
      return `Hooks ${numbers[0]} and ${numbers[1]} changed`
    default:
      return `Hooks ${numbers.slice(0, numbers.length - 1).join(', ')} and ${numbers[numbers.length - 1]} changed`
  }
}

interface Props {
  fiberID: number
}

export const WhatChanged = memo(({ fiberID }: Props) => {
  const { reactProfile, rootID, selectedCommitIndex } = useModuleState(ReactFlameGraphModule)

  const changeDescriptions = useMemo(() => {
    return reactProfile?.dataForRoots[rootID].commitData[selectedCommitIndex]?.changeDescriptions
  }, [rootID, selectedCommitIndex, reactProfile])

  if (changeDescriptions === null) {
    return null
  }

  const changeDescription = changeDescriptions?.[fiberID]
  if (changeDescription == null) {
    return null
  }

  const { context, didHooksChange, hooks, isFirstMount, props, state } = changeDescription

  if (isFirstMount) {
    return (
      <WhatChangedComponent>
        <WhatChangedLabel>Why did this render?</WhatChangedLabel>
        <WhatChangedItem>This is the first time the component rendered.</WhatChangedItem>
      </WhatChangedComponent>
    )
  }

  const changes = []

  if (context === true) {
    changes.push(<WhatChangedItem key="context">• Context changed</WhatChangedItem>)
  } else if (typeof context === 'object' && context !== null && context.length !== 0) {
    changes.push(
      <WhatChangedItem key="context">
        • Context changed:
        {context.map((key) => (
          <WhatChangedKey key={key}>{key}</WhatChangedKey>
        ))}
      </WhatChangedItem>,
    )
  }

  if (didHooksChange) {
    if (Array.isArray(hooks)) {
      changes.push(<WhatChangedItem key="hooks">• {hookIndicesToString(hooks)}</WhatChangedItem>)
    } else {
      changes.push(<WhatChangedItem key="hooks">• Hooks changed</WhatChangedItem>)
    }
  }

  if (props !== null && props.length !== 0) {
    changes.push(
      <WhatChangedItem key="props">
        • Props changed:
        {props.map((key) => (
          <WhatChangedKey key={key}>{key}</WhatChangedKey>
        ))}
      </WhatChangedItem>,
    )
  }

  if (state !== null && state.length !== 0) {
    changes.push(
      <WhatChangedItem key="state">
        • State changed:
        {state.map((key) => (
          <WhatChangedKey key={key}>{key}</WhatChangedKey>
        ))}
      </WhatChangedItem>,
    )
  }

  if (changes.length === 0) {
    changes.push(<WhatChangedItem key="nothing">The parent component rendered.</WhatChangedItem>)
  }

  return (
    <WhatChangedComponent>
      <WhatChangedLabel>Why did this render?</WhatChangedLabel>
      {changes}
    </WhatChangedComponent>
  )
})
