import { useModuleState } from '@sigi/react'
import { useDebugValue } from 'react'

import { GlobalModule } from './init.module'

export function useSettings() {
  const settings = useModuleState(GlobalModule, {
    selector: ({ settings }) => settings,
    dependencies: [],
  })

  useDebugValue(settings)
  return settings!
}
