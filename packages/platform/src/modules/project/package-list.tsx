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

import { DocumentCard, Stack } from '@fluentui/react'
import { FC, useCallback } from 'react'
import { useHistory } from 'react-router'

import { pathFactory } from '@perfsee/shared/routes'

import { PackageNode } from './list.module'
import { PackageCardHeader, PackageInfoText, PackageInfoTitle, PackageListWrap, PackageTitle } from './style'

export const cardStyle = {
  root: {
    width: '100%',
    maxWidth: 'unset',
  },
}

export interface PackageListProps {
  packages: PackageNode[]
}

export const PackageList: FC<PackageListProps> = ({ packages }) => {
  return (
    <PackageListWrap>
      {packages.map((pkg) => {
        return <PackageItem pkg={pkg} key={pkg.name} />
      })}
    </PackageListWrap>
  )
}

interface PackageItemProps {
  pkg: PackageNode
}
const PackageItem: FC<PackageItemProps> = ({ pkg }) => {
  const history = useHistory()
  const onClick = useCallback(() => {
    history.push(
      pathFactory.project.package.detail({
        projectId: pkg.projectId,
        packageId: pkg.id,
      }),
    )
  }, [history, pkg])

  const keyworkds = pkg.keywords ? (
    <div>
      <PackageInfoTitle>Keyworkds: </PackageInfoTitle>
      <PackageInfoText>{pkg.keywords.join(', ')}</PackageInfoText>
    </div>
  ) : null

  return (
    <DocumentCard styles={cardStyle} onClick={onClick}>
      <PackageCardHeader>
        <PackageTitle>{pkg.name}</PackageTitle>
      </PackageCardHeader>
      <Stack tokens={{ padding: '12px', childrenGap: '4px' }}>
        <div>
          <PackageInfoTitle>Description: </PackageInfoTitle>
          <PackageInfoText>{pkg.description}</PackageInfoText>
        </div>
        {keyworkds}
      </Stack>
    </DocumentCard>
  )
}
