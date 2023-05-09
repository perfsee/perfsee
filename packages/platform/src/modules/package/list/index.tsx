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

import { Stack, DocumentCard } from '@fluentui/react'
import { useModule, useModuleState } from '@sigi/react'
import React, { useCallback, useEffect, useState } from 'react'

import { ContentCard, Empty, Pagination, useQueryString } from '@perfsee/components'

import { BranchSelector } from '../../components'
import { ProjectModule } from '../../shared'
import { DetailHeaderDescription } from '../detail/styles'

import { PackageMeta } from './meta'
import { PackageListModule, Package } from './module'
import { cardStyle, PackageCardHeader, PackageTitle, PackageListWrap } from './styles'
import { PackageBundleTableList } from './table'

export const PackageList = () => {
  const [{ loading, packages, totalCount }, dispatcher] = useModule(PackageListModule)
  const { project } = useModuleState(ProjectModule)

  const [{ page = 1, pageSize = 20, name }, updateQueryString] = useQueryString<{
    page: number
    pageSize: number
    branch: string
    name: string
  }>()

  useEffect(() => {
    dispatcher.getPackages({
      pageNum: page,
      pageSize,
      name,
    })
    return () => {
      if (!project) {
        dispatcher.resetState()
      }
    }
  }, [dispatcher, name, page, pageSize, project])

  const onPageChange = useCallback(
    (pageNum: number, pageSize: number) => {
      updateQueryString({
        page: pageNum,
        pageSize,
      })
    },
    [updateQueryString],
  )

  const onRenderHeader = useCallback(
    () => (
      <Stack horizontal horizontalAlign="space-between" verticalAlign="center" styles={{ root: { flexGrow: 1 } }}>
        <span>Package List</span>
      </Stack>
    ),
    [],
  )

  const content =
    !loading && !totalCount ? (
      <Empty title="No package uploaded" />
    ) : (
      <>
        <PackageListWrap>
          {packages.map((pkg) => (
            <PackageItem item={pkg} key={pkg.id} />
          ))}
        </PackageListWrap>
        <Pagination
          page={page}
          total={totalCount}
          pageSize={pageSize}
          onChange={onPageChange}
          hideOnSinglePage={true}
          showSizeChanger={true}
        />
      </>
    )

  return (
    <>
      <ContentCard onRenderHeader={onRenderHeader}>{content}</ContentCard>
    </>
  )
}

export const PackageItem: React.FC<{ item: Package }> = ({ item }) => {
  const [branch, setBranch] = useState<string | undefined>()
  const onChangeBranch = useCallback(
    (branch: string | undefined) => {
      setBranch(branch)
    },
    [setBranch],
  )

  const branchSelector = (
    <Stack horizontal tokens={{ childrenGap: 8 }}>
      <BranchSelector defaultBranch={branch} onChange={onChangeBranch} />
    </Stack>
  )

  return (
    <DocumentCard styles={cardStyle}>
      <PackageCardHeader>
        <Stack horizontal verticalAlign="baseline" tokens={{ childrenGap: 12 }}>
          <PackageTitle>{item.name}</PackageTitle>
          <DetailHeaderDescription>{item.description}</DetailHeaderDescription>
        </Stack>
        <Stack horizontalAlign="end">{branchSelector}</Stack>
      </PackageCardHeader>
      <PackageMeta pkg={item} branch={branch} />
      <PackageBundleTableList
        packageId={item.id}
        bundles={item.bundles?.edges.map((node) => node.node) ?? []}
        totalCount={item.bundles?.pageInfo.totalCount ?? 0}
        branch={branch}
      />
    </DocumentCard>
  )
}
