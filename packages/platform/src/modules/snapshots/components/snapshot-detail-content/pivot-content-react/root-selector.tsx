import { Dropdown, IDropdownOption } from '@fluentui/react'
import { useModule } from '@sigi/react'
import { FormEvent, useCallback, useMemo } from 'react'

import { ReactFlameGraphModule } from './module'

const style = { width: 'max-content', minWidth: '100px' }

export const RootSelector = () => {
  const [{ reactProfile, rootID }, dispatcher] = useModule(ReactFlameGraphModule)

  const options = useMemo(() => {
    return Array.from(reactProfile?.dataForRoots.values() ?? []).map((data) => {
      return { key: data.rootID, text: data.displayName }
    })
  }, [reactProfile])

  const onChange = useCallback(
    (_ev: FormEvent, item?: IDropdownOption) => {
      item && dispatcher.setRootID(Number(item.key))
    },
    [dispatcher],
  )

  if (!reactProfile || options.length <= 1) {
    // Don't take up visual space if there's only one root.
    return null
  }

  return <Dropdown style={style} selectedKey={rootID} onChange={onChange} options={options} />
}
