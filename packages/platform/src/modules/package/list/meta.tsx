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

import { Spinner, SpinnerSize, Stack } from '@fluentui/react'
import { useModule, useModuleState } from '@sigi/react'
import { FC, useCallback, useEffect } from 'react'
import { useHistory } from 'react-router'

import { BundleJobStatus } from '@perfsee/schema'
import { pathFactory } from '@perfsee/shared/routes'

import { ProjectModule } from '../../shared'
import BarGraph, { Reading } from '../detail/pivot-content-overview/bar-graph/bar-graph'

import { Package, PackageListModule } from './module'
import { InfoTitle, InfoText } from './styles'

interface Props {
  pkg: Package
  branch?: string
}
export const PackageMeta: FC<Props> = ({ pkg, branch }) => {
  const { project } = useModuleState(ProjectModule)
  const [{ histories }, dispatcher] = useModule(PackageListModule)
  const packageId = String(pkg.id)
  const projectId = project?.id
  const historyRouter = useHistory()

  const currentDateTime = pkg.updatedAt

  useEffect(() => {
    currentDateTime && dispatcher.getHistory({ packageId, currentDateTime, branch })
  }, [dispatcher, packageId, currentDateTime, branch])

  const onBarClick = useCallback(
    (reading: Reading) => {
      projectId &&
        historyRouter.push(
          pathFactory.project.package.detail({ packageId: reading.packageId, packageBundleId: reading.id, projectId }),
        )
    },
    [historyRouter, projectId],
  )

  if (!project) {
    return null
  }

  const keywords = pkg.keywords ? (
    <div>
      <InfoTitle>Keywords: </InfoTitle>
      <InfoText>{pkg.keywords.join(', ')}</InfoText>
    </div>
  ) : null

  const history = histories[pkg.id]
  const barGraph = !history ? (
    <Spinner size={SpinnerSize.large} label="loading history" />
  ) : (
    <BarGraph
      onBarClick={onBarClick}
      readings={history.map((h) => ({
        ...h,
        version: h.version ?? 'unknown',
        packageId: h.packageId,
        id: h.id,
        size: h.size?.raw ?? 0,
        gzip: h.size?.gzip ?? 0,
        disabled: h.status !== BundleJobStatus.Passed,
      }))}
    />
  )

  return (
    <Stack tokens={{ padding: '16px', childrenGap: '4px' }} horizontal horizontalAlign="space-between">
      <Stack>
        {keywords}
        <div>
          <InfoTitle>Created at: </InfoTitle>
          <InfoText>{new Date(pkg.createdAt).toLocaleString()}</InfoText>
        </div>
        <div>
          <InfoTitle>Updated at: </InfoTitle>
          <InfoText>{new Date(pkg.updatedAt).toLocaleString()}</InfoText>
        </div>
      </Stack>
      <Stack>{barGraph}</Stack>
    </Stack>
  )
}
