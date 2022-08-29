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

import { MessageBarType, Persona, Text } from '@fluentui/react'
import { SelectionMode } from '@fluentui/utilities'
import { useModule } from '@sigi/react'
import React, { useCallback, useEffect, useMemo } from 'react'

import { ForeignLink, MessageBar, Table, TableColumnProps } from '@perfsee/components'

import { GithubInstallationModel, Installation } from './github-installation.module'
import { SelectorContainer } from './style'

interface Props {
  onSelect: (installation: Installation) => void
}

const columns: TableColumnProps<Installation | null>[] = [
  {
    key: 'login',
    name: 'Login',
    minWidth: 100,
    flexGrow: 1,
    onRender: (installation) => (
      <>
        <Persona imageUrl={installation!.account.avatar_url} /> <Text>{installation!.account.login}</Text>
      </>
    ),
  },
]

export const InstallationSelector: React.VFC<Props> = ({ onSelect }) => {
  const [{ installations, installationsTotalCount, loading }, dispatch] = useModule(GithubInstallationModel)

  useEffect(() => {
    dispatch.loadMore()
    return dispatch.reset
  }, [dispatch])

  const loadMore = useCallback(() => {
    dispatch.loadMore()
  }, [dispatch])

  const tableItems = useMemo(() => {
    if (installations.length === installationsTotalCount) {
      return installations
    } else {
      return (installations as (Installation | null)[]).concat([null])
    }
  }, [installations, installationsTotalCount])

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
    (item: Installation | null) => {
      if (item) {
        onSelect(item)
      }
    },
    [onSelect],
  )

  return (
    <>
      {!loading && installationsTotalCount === 0 ? (
        <MessageBar messageBarType={MessageBarType.blocked}>
          You do not have our Github app installed, please
          <ForeignLink href="/github/new">install our Github app</ForeignLink>.
        </MessageBar>
      ) : (
        <MessageBar messageBarType={MessageBarType.info}>
          If you can't find the desired Github user or organization below, please
          <ForeignLink href="/github/new">install our Github app</ForeignLink> to the user or organization.
        </MessageBar>
      )}

      <SelectorContainer onScroll={handleScroll}>
        <Table
          selectionMode={SelectionMode.none}
          item
          items={tableItems}
          columns={columns}
          isHeaderVisible={false}
          enableShimmer={loading && installations.length === 0}
          shimmerLines={8}
          onRowClick={handleRowClick}
        />
      </SelectorContainer>
    </>
  )
}
