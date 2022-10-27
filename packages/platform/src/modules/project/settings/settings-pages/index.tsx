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

import { IContextualMenuProps, PrimaryButton, Stack } from '@fluentui/react'
import { useModule } from '@sigi/react'
import { useCallback, useMemo, useState, useEffect } from 'react'

import { SearchSelect } from '@perfsee/components'

import { DeleteProgress, PageSchema, PropertyModule, UpdatePagePayload } from '../../../shared'
import { SettingCards } from '../cards'
import { emptyRelation } from '../helper'
import { DeleteContent, DialogVisible, SettingDialogs } from '../settings-common-comp'

import { CompetitorPageEditForm } from './competitor-page-edit-form'
import { PageEditForm } from './page-edit-form'
import { PageListCell } from './page-list-cell'

const PageTypeFilters = {
  all: {
    key: 'all',
    text: 'All',
    selector: () => true,
  },
  normal: {
    key: 'normal',
    text: 'Page',
    selector: (page: PageSchema) => !page.isCompetitor,
  },
  competitor: {
    key: 'competitor',
    text: 'Competitor Page',
    selector: (page: PageSchema) => page.isCompetitor,
  },
  disabled: {
    key: 'disabled',
    text: 'Disabled',
    selector: (page: PageSchema) => page.disable,
  },
}

export const SettingsPages = () => {
  const [{ pages, pageRelationMap, hasCompetitorEnv, deleteProgress }, dispatcher] = useModule(PropertyModule, {
    selector: (state) => ({
      pages: state.pages,
      pageRelationMap: state.pageRelationMap,
      hasCompetitorEnv: !!state.environments.filter((env) => env.isCompetitor).length,
      deleteProgress: state.deleteProgress.page,
    }),
    dependencies: [],
  })

  useEffect(() => {
    dispatcher.fetchPageRelation()
  }, [dispatcher])

  const [page, setPage] = useState<Partial<PageSchema>>({})
  const [visible, setDialogVisible] = useState<DialogVisible>(DialogVisible.Off)
  const [filterKey, setFilterKey] = useState<keyof typeof PageTypeFilters>('all')

  const onChangeFilterKey = useCallback((key: string) => {
    setFilterKey(key as keyof typeof PageTypeFilters)
  }, [])

  const onCreatePage = useCallback(() => {
    setPage({ isCompetitor: false })
    setDialogVisible(DialogVisible.Edit)
  }, [])

  const onCreateCompetitor = useCallback(() => {
    setPage({ isCompetitor: true })
    setDialogVisible(DialogVisible.Edit)
  }, [])

  const closeModal = useCallback(() => {
    setDialogVisible(DialogVisible.Off)
  }, [])

  const closeDeleteModal = useCallback(() => {
    closeModal()
    dispatcher.setDeleteProgress({ type: 'page', progress: DeleteProgress.None })
  }, [closeModal, dispatcher])

  const onUpdatePage = useCallback(
    (payload: UpdatePagePayload) => {
      dispatcher.updateOrCreatePage(payload)
      closeModal()
    },
    [closeModal, dispatcher],
  )

  const onDeletePage = useCallback(() => {
    page.id && dispatcher.deletePage(page.id)
  }, [dispatcher, page])

  const openEditModal = useCallback((p?: PageSchema) => {
    if (p) {
      setPage(p)
      setDialogVisible(DialogVisible.Edit)
    }
  }, [])

  const onClickDisable = useCallback(
    (page: PageSchema) => {
      dispatcher.updateOrCreatePage({
        page: { ...page, disable: true },
        relation: pageRelationMap.get(page.id) ?? emptyRelation,
      })
    },
    [dispatcher, pageRelationMap],
  )

  const onClickRestore = useCallback(
    (page: PageSchema) => {
      dispatcher.updateOrCreatePage({
        page: { ...page, disable: false },
        relation: pageRelationMap.get(page.id) ?? emptyRelation,
      })
    },
    [dispatcher, pageRelationMap],
  )

  const openDeleteModal = useCallback((p: PageSchema) => {
    setPage(p)
    setDialogVisible(DialogVisible.Delete)
  }, [])

  const onRenderCell = useCallback(
    (item?: PageSchema) => {
      if (!item) return null
      return (
        <PageListCell
          page={item}
          openEditModal={openEditModal}
          openDeleteModal={openDeleteModal}
          onClickRestore={onClickRestore}
          onClickDisable={onClickDisable}
        />
      )
    },
    [onClickDisable, onClickRestore, openDeleteModal, openEditModal],
  )

  const menuProps = useMemo<IContextualMenuProps>(
    () => ({
      items: [
        {
          key: 'page',
          text: 'page',
          iconProps: { iconName: 'desktop' },
          onClick: onCreatePage,
        },
        {
          key: 'competitor',
          text: 'competitor page',
          iconProps: { iconName: 'competitor' },
          disabled: !hasCompetitorEnv,
          onClick: onCreateCompetitor,
        },
      ],
    }),
    [hasCompetitorEnv, onCreateCompetitor, onCreatePage],
  )

  const typeOptions = useMemo(() => Object.values(PageTypeFilters), [])

  const pageList = useMemo(() => {
    const allPages = pages.filter((page) => !page.isE2e && !page.isTemp)
    const selector = PageTypeFilters[filterKey]?.selector

    if (selector) {
      return allPages.filter(selector)
    }

    return allPages
  }, [filterKey, pages])

  const editContent = useMemo(() => {
    if (page.isCompetitor) {
      return <CompetitorPageEditForm defaultPage={page} onSubmit={onUpdatePage} closeModal={closeModal} />
    }

    return <PageEditForm defaultPage={page} onSubmit={onUpdatePage} closeModal={closeModal} />
  }, [page, onUpdatePage, closeModal])

  const deleteContent = useMemo(() => {
    return (
      <DeleteContent
        type="page"
        name={page?.name ?? ''}
        progress={deleteProgress}
        onDelete={onDeletePage}
        closeModal={closeDeleteModal}
      />
    )
  }, [closeDeleteModal, deleteProgress, onDeletePage, page])

  return (
    <div>
      <Stack horizontal horizontalAlign="space-between">
        <PrimaryButton text="Create" iconProps={{ iconName: 'plus' }} menuProps={menuProps} />
        <Stack horizontal horizontalAlign="space-between" tokens={{ childrenGap: '12px' }}>
          <SearchSelect
            title="Type"
            value={filterKey}
            options={typeOptions}
            selectOptions={typeOptions}
            onChange={onChangeFilterKey}
          />
        </Stack>
      </Stack>
      {!!pageRelationMap.size && <SettingCards items={pageList} onRenderCell={onRenderCell} />}

      <SettingDialogs
        type={page.isCompetitor ? 'Competitor Page' : 'Page'}
        visible={visible}
        onCloseDialog={closeModal}
        editContent={editContent}
        deleteContent={deleteContent}
        isCreate={!page.id}
      />
    </div>
  )
}
