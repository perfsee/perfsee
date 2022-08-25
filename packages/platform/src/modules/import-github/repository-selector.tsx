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

import { MessageBarType } from '@fluentui/react'
import { SelectionMode } from '@fluentui/utilities'
import { useModule } from '@sigi/react'
import React, { useCallback, useEffect, useMemo } from 'react'

import { MessageBar, Table, TableColumnProps } from '@perfsee/components'

import { GithubRepositoryModel, Repository } from './github-repository.module'
import { SelectorContainer } from './style'

interface Props {
  installationId: number
  onSelect: (repository: Repository) => void
}

const columns: TableColumnProps<Repository | null>[] = [
  {
    key: 'full_name',
    name: 'Fullname',
    minWidth: 100,
    flexGrow: 1,
    onRender: (repository) => <>{repository!.full_name}</>,
  },
]

export const RepositorySelector: React.VFC<Props> = ({ installationId, onSelect }) => {
  const [{ repositories, repositoriesTotalCount, loading }, dispatch] = useModule(GithubRepositoryModel)

  const loadMore = useCallback(() => {
    dispatch.loadMore(installationId)
  }, [dispatch, installationId])

  useEffect(() => {
    loadMore()
    return dispatch.reset
  }, [dispatch, loadMore])

  const tableItems = useMemo(() => {
    if (repositories.length === repositoriesTotalCount) {
      return repositories
    } else {
      return (repositories as (Repository | null)[]).concat([null])
    }
  }, [repositories, repositoriesTotalCount])

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const element = e.currentTarget
      if (element.scrollHeight - element.scrollTop - element.clientHeight < 50) {
        loadMore()
      }
    },
    [loadMore],
  )

  const handleRowClick = useCallback(
    (item: Repository | null) => {
      if (item) {
        onSelect(item)
      }
    },
    [onSelect],
  )

  return (
    <>
      <MessageBar messageBarType={MessageBarType.info}>
        If you can't find the desired Github repository below, please
        <a href="/github/new">configure the repository access</a> of Github app.
      </MessageBar>
      <SelectorContainer onScroll={handleScroll}>
        <Table
          selectionMode={SelectionMode.none}
          item
          items={tableItems}
          columns={columns}
          isHeaderVisible={false}
          shimmerLines={8}
          enableShimmer={loading && repositories.length === 0}
          onRowClick={handleRowClick}
        />
      </SelectorContainer>
    </>
  )
}
