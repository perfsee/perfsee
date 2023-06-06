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

import { useModule } from '@sigi/react'
import { memo, useEffect } from 'react'
import { RouteComponentProps, useHistory } from 'react-router'

import { PackageResultContext, PackageDetail as PackageReport } from '@perfsee/package-report'
import { pathFactory } from '@perfsee/shared/routes'

import { PackageBundleDetailModule } from './module'

const HISTORY_LENGTH = 22

export const PackageDetail = memo<
  RouteComponentProps<{ packageId: string; packageBundleId: string; projectId: string }>
>(({ match }) => {
  const { packageBundleId, packageId, projectId } = match.params

  const [{ current, history, loading, historyLoading }, dispatcher] = useModule(PackageBundleDetailModule)
  const historyRouter = useHistory()

  useEffect(() => {
    if (!packageBundleId && current) {
      historyRouter.replace(
        pathFactory.project.package.detail({
          ...match.params,
          packageBundleId: current.id,
        }),
      )
    }
  }, [current, packageBundleId, historyRouter, match.params])

  useEffect(() => {
    dispatcher.getBundleDetail({ packageBundleId, packageId, projectId })
    dispatcher.getHistory({ projectId, packageId, currentDateTime: new Date().toString(), limit: HISTORY_LENGTH })
    return dispatcher.reset
  }, [dispatcher, packageBundleId, packageId, projectId])

  return (
    <PackageResultContext.Provider
      value={{
        current,
        history,
        loading,
        historyLoading,
      }}
    >
      <PackageReport {...match.params} />
    </PackageResultContext.Provider>
  )
})
