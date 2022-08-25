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

import { CaretDownOutlined, CaretRightOutlined } from '@ant-design/icons'
import { css } from '@emotion/react'
import { FC, memo, useCallback, useState } from 'react'

import { DuplicatePackage, EntryDiff } from '@perfsee/shared'

import { DuplicatePackagesContainer, DuplicatePackagesHeader, DuplicatePackagesInner } from './style'

interface Props {
  diff: EntryDiff
}

export const DuplicatePackages: FC<Props> = memo(({ diff }) => {
  const [collapsed, setCollapsed] = useState(false)
  const { duplicatedPackages } = diff

  const toggleCollapse = useCallback(() => {
    setCollapsed((current) => !current)
  }, [])

  if (!duplicatedPackages?.length) {
    return null
  }

  const packages = duplicatedPackages.map((duplicatePackage) => (
    <DuplicatePackageDetail key={duplicatePackage.name} package={duplicatePackage} />
  ))

  return (
    <DuplicatePackagesContainer>
      <DuplicatePackagesHeader onClick={toggleCollapse}>
        {collapsed ? <CaretRightOutlined /> : <CaretDownOutlined />}
        <h4>Bundle contains {duplicatedPackages.length} duplicate package(s)</h4>
      </DuplicatePackagesHeader>
      {!collapsed && (
        <DuplicatePackagesInner>
          <ol>{packages}</ol>
        </DuplicatePackagesInner>
      )}
    </DuplicatePackagesContainer>
  )
})

const DuplicatePackageDetail = (props: { package: DuplicatePackage }) => {
  const reasons = props.package.versions.map((version, i) => (
    <li css={css({ listStyle: 'circle', marginLeft: '-30px' })} key={i}>
      {version}
    </li>
  ))

  return (
    <li>
      <b>
        {props.package.name} ({reasons.length})
      </b>
      <ul>{reasons}</ul>
    </li>
  )
}
