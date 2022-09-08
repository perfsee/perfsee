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

import { MessageBarType, Persona, Spinner, SpinnerSize, Text } from '@fluentui/react'
import { SelectionMode } from '@fluentui/utilities'
import { useModule } from '@sigi/react'
import React, { useCallback, useEffect, useMemo } from 'react'

import { ForeignLink, MessageBar, Table, TableColumnProps } from '@perfsee/components'

import { AssociatedGithubInstallationsModel } from './associated-github-installations.module'
import { GithubInstallationModel, Installation } from './github-installation.module'
import { CenterText, PersonaContainer, SelectorContainer } from './style'

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
  const [
    {
      installations: associatedInstallations,
      installationsTotalCount: associatedInstallationsTotalCount,
      loading: associatedInstallationsLoading,
    },
    associatedGithubInstallationsDispatch,
  ] = useModule(AssociatedGithubInstallationsModel)
  const [{ installation, loading: installationLoading }, githubInstallationDispatch] =
    useModule(GithubInstallationModel)

  useEffect(() => {
    associatedGithubInstallationsDispatch.loadMore()
    return associatedGithubInstallationsDispatch.reset
  }, [associatedGithubInstallationsDispatch])

  const loadMore = useCallback(() => {
    associatedGithubInstallationsDispatch.loadMore()
  }, [associatedGithubInstallationsDispatch])

  useEffect(() => {
    githubInstallationDispatch.getInstallation()
    return githubInstallationDispatch.reset
  }, [githubInstallationDispatch])

  const tableItems = useMemo(() => {
    let items
    if (associatedInstallations.length === associatedInstallationsTotalCount) {
      items = associatedInstallations
    } else {
      items = (associatedInstallations as (Installation | null)[]).concat([null])
    }

    return items.filter((t) => t == null || t.account.type === 'Organization')
  }, [associatedInstallations, associatedInstallationsTotalCount])

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

  const handleClickYour = useCallback(() => {
    if (installation) {
      onSelect(installation)
    }
  }, [onSelect, installation])

  return (
    <>
      <CenterText variant="smallPlus">
        <b>Your:</b>
      </CenterText>
      {!installationLoading ? (
        installation ? (
          <PersonaContainer horizontal onClick={handleClickYour}>
            <Persona imageUrl={installation.account.avatar_url} /> <Text>{installation.account.login}</Text>
          </PersonaContainer>
        ) : (
          <MessageBar messageBarType={MessageBarType.blocked}>
            You do not have our Github app installed, please
            <ForeignLink href="/github/new">install our Github app</ForeignLink>.
          </MessageBar>
        )
      ) : (
        <Spinner size={SpinnerSize.large} />
      )}
      <CenterText variant="smallPlus">
        <b>Organizations:</b>
      </CenterText>
      <MessageBar messageBarType={MessageBarType.info}>
        If you can't find the desired Github organization below, please
        <ForeignLink href="/github/new">install our Github app</ForeignLink> to the user or organization.
      </MessageBar>
      <SelectorContainer onScroll={handleScroll} size={300}>
        <Table
          selectionMode={SelectionMode.none}
          item
          items={tableItems}
          columns={columns}
          isHeaderVisible={false}
          enableShimmer={associatedInstallationsLoading && associatedInstallations.length === 0}
          shimmerLines={6}
          onRowClick={handleRowClick}
        />
      </SelectorContainer>
    </>
  )
}
