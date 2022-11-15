import { useModule } from '@sigi/react'
import { useEffect } from 'react'

import { AppVersion, AppVersionModule } from './app-version.module'

export function useAppVersion(hash: string): AppVersion | undefined {
  const [appVersion, dispatch] = useModule(AppVersionModule, {
    selector: (s) => s.appVersions[hash],
    dependencies: [hash],
  })

  useEffect(() => {
    if (!appVersion) {
      dispatch.getAppVersion({ hash })
    }
  }, [appVersion, dispatch])

  return appVersion
}
