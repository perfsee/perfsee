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

import { Stack } from '@fluentui/react'
import { useModule } from '@sigi/react'
import { FC, memo, useCallback, useEffect } from 'react'
import { RouteComponentProps, useHistory } from 'react-router'

import { ContentCard } from '@perfsee/components'
import { pathFactory } from '@perfsee/shared/routes'

import { InfoText, InfoTitle } from '../list/styles'

import { PackageBundleDetailModule, PackageBundleResult } from './module'
import { ReportContentWithRoute } from './pivot-content'
import { DetailHeaderDescription, DetailKey } from './styles'

export const PackageDetail = memo<
  RouteComponentProps<{ packageId: string; packageBundleId: string; projectId: string }>
>(({ match }) => {
  const { packageBundleId, packageId, projectId } = match.params

  const [{ current }, dispatcher] = useModule(PackageBundleDetailModule)
  const history = useHistory()

  useEffect(() => {
    if (!packageBundleId && current) {
      history.replace(
        pathFactory.project.package.detail({
          ...match.params,
          packageBundleId: current.id,
        }),
      )
    }
  }, [current, packageBundleId, history, match.params])

  useEffect(() => {
    dispatcher.getBundleDetail({ packageBundleId, packageId, projectId })
    return dispatcher.reset
  }, [dispatcher, packageBundleId, packageId, projectId])

  const onRenderHeader = useCallback(() => {
    if (!current?.report) {
      return null
    }

    return <PackageDetailHeader packageBundleResult={current} />
  }, [current])

  return (
    <ContentCard onRenderHeader={onRenderHeader}>
      <ReportContentWithRoute {...match.params} />
    </ContentCard>
  )
})

interface DetailHeaderProps {
  packageBundleResult: PackageBundleResult
}

const PackageDetailHeader: FC<DetailHeaderProps> = memo(({ packageBundleResult }) => {
  const { packageJson } = packageBundleResult.report!
  return (
    <Stack>
      <Stack
        styles={{ root: { marginBottom: '12px' } }}
        horizontal
        verticalAlign="center"
        horizontalAlign="space-between"
      >
        <div>
          <DetailKey>{packageJson.name}</DetailKey>
          <DetailHeaderDescription>{packageJson.description}</DetailHeaderDescription>
        </div>
      </Stack>
      <Stack tokens={{ padding: '0 0 0 6px' }}>
        <div>
          <InfoTitle>Version: </InfoTitle>
          <InfoText>{packageBundleResult.version}</InfoText>
        </div>
        <div>
          <InfoTitle>Created at: </InfoTitle>
          <InfoText>{new Date(packageBundleResult.createdAt).toLocaleString()}</InfoText>
        </div>
      </Stack>
    </Stack>
  )
})
