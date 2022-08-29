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

import { Icon, MessageBarButton, MessageBarType, PrimaryButton, SharedColors, Stack, TextField } from '@fluentui/react'
import { SelectionMode } from '@fluentui/utilities'
import { useModule } from '@sigi/react'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { ForeignLink, MessageBar, Table, TableColumnProps } from '@perfsee/components'

import { GithubRepositoryModel, Repository } from './github-repository.module'
import { CenterText, SelectorContainer } from './style'

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
    onRender: (repository) => <div>{repository!.full_name}</div>,
  },
]

export const RepositorySelector: React.VFC<Props> = ({ installationId, onSelect }) => {
  const [selectedRepository, setSelectedRepository] = useState<Repository>()
  const [{ repositories, repositoriesTotalCount, loading, repositoryVerifying, repositoryVerification }, dispatch] =
    useModule(GithubRepositoryModel)

  const loadMore = useCallback(() => {
    dispatch.loadMore()
  }, [dispatch])

  useEffect(() => {
    dispatch.search({ installationId, query: '' })
  }, [dispatch, installationId])

  useEffect(() => {
    return dispatch.reset
  }, [dispatch])

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
        setSelectedRepository(item)
        dispatch.setVerification(null)
        const [owner, repo] = item.full_name.split('/')
        dispatch.verifyRepository({
          owner,
          repo,
        })
      }
    },
    [dispatch],
  )

  const handleSearch = useCallback(
    (_: any, value?: string) => {
      dispatch.search({
        installationId,
        query: value || '',
      })
    },
    [dispatch, installationId],
  )

  const handleRetry = useCallback(() => {
    const [owner, repo] = selectedRepository!.full_name.split('/')
    dispatch.verifyRepository({
      owner,
      repo,
    })
  }, [dispatch, selectedRepository])

  const handleChangeRepository = useCallback(() => {
    setSelectedRepository(undefined)
  }, [])

  const handleNext = useCallback(() => {
    onSelect(selectedRepository!)
  }, [onSelect, selectedRepository])

  return (
    <>
      {!selectedRepository ? (
        <>
          <MessageBar messageBarType={MessageBarType.info}>
            If you can't find the desired Github repository below, please
            <ForeignLink href="/github/new">configure the repository access</ForeignLink> of Github app.
          </MessageBar>
          <TextField placeholder="Search repositories..." onChange={handleSearch} />
          <SelectorContainer size={330} onScroll={handleScroll}>
            <Table
              selectionMode={SelectionMode.none}
              item
              items={tableItems}
              columns={columns}
              isHeaderVisible={false}
              shimmerLines={7}
              enableShimmer={loading && repositories.length === 0}
              onRowClick={handleRowClick}
            />
          </SelectorContainer>
        </>
      ) : (
        <>
          <Stack tokens={{ childrenGap: 16, padding: '16px 0' }}>
            <CenterText variant="smallPlus">
              Repository: {selectedRepository.full_name}{' '}
              <a>
                <Icon iconName="swap" onClick={handleChangeRepository} />
              </a>
            </CenterText>
            {repositoryVerifying ? (
              <>
                <CenterText variant="small">
                  <Icon iconName="loading" /> Permission verifying
                </CenterText>
              </>
            ) : repositoryVerification?.ok ? (
              <>
                <CenterText variant="small">
                  <Icon iconName="completed" styles={{ root: { color: SharedColors.greenCyan10 } }} /> Verification
                  succeeded
                </CenterText>
              </>
            ) : (
              <>
                <MessageBar
                  actions={
                    <div>
                      <MessageBarButton onClick={handleRetry}>Retry</MessageBarButton>
                    </div>
                  }
                  messageBarType={MessageBarType.error}
                >
                  {repositoryVerification?.error || 'Unknown error.'}
                  <br />
                  Please
                  <ForeignLink href="/github/new">configure the repository access</ForeignLink> of Github app.
                </MessageBar>
              </>
            )}
          </Stack>
          <PrimaryButton disabled={!repositoryVerification?.ok} onClick={handleNext}>
            Next
          </PrimaryButton>
        </>
      )}
    </>
  )
}
