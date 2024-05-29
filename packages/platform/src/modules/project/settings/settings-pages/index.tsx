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

import { IContextualMenuProps, PrimaryButton, Separator, Stack } from '@fluentui/react'
import { useModule } from '@sigi/react'
import { useCallback, useMemo, useState, useEffect } from 'react'

import { DeleteProgress, PageSchema, PropertyModule, UpdatePagePayload } from '../../../shared'
import { SettingCards } from '../cards'
import { emptyRelation } from '../helper'
import { DeleteContent, DialogVisible, SettingDialogs } from '../settings-common-comp'

import { PageEditForm } from './page-edit-form'
import { PageListCell } from './page-list-cell'
import { PingContent } from './ping-content'
import { TempPageList } from './temp-list'

export const SettingsPages = () => {
  const [{ pages, pageRelationMap, pingResultMap, deleteProgress, envMap, profileMap }, dispatcher] = useModule(
    PropertyModule,
    {
      selector: (state) => ({
        pages: state.pages,
        pageRelationMap: state.pageRelationMap,
        deleteProgress: state.deleteProgress.page,
        envMap: state.envMap,
        profileMap: state.profileMap,
        pingResultMap: state.pingResultMap,
      }),
      dependencies: [],
    },
  )

  useEffect(() => {
    dispatcher.fetchPageRelation()
  }, [dispatcher])

  const [page, setPage] = useState<Partial<PageSchema>>({})
  const [visible, setDialogVisible] = useState<DialogVisible>(DialogVisible.Off)

  const { tempList, competitorList, pageList } = useMemo(() => {
    const tempList: PageSchema[] = []
    const competitorList: PageSchema[] = []
    const pageList: PageSchema[] = []
    pages.forEach((p) => {
      if (p.isCompetitor) {
        competitorList.push(p)
      } else if (p.isTemp) {
        tempList.push(p)
      } else {
        pageList.push(p)
      }
    })
    return { tempList, competitorList, pageList }
  }, [pages])

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

  const openCreatePageModal = useCallback(() => {
    setPage({ isCompetitor: false })
    setDialogVisible(DialogVisible.Edit)
  }, [])

  const openPingModal = useCallback(
    (p?: PageSchema) => {
      if (p) {
        setPage(p)
        setDialogVisible(DialogVisible.Ping)
        dispatcher.fetchPingCheckStatus(p.id)
      }
    },
    [dispatcher],
  )

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
          openPingModal={openPingModal}
          openEditModal={openEditModal}
          openDeleteModal={openDeleteModal}
          onClickRestore={onClickRestore}
          onClickDisable={onClickDisable}
        />
      )
    },
    [onClickDisable, onClickRestore, openDeleteModal, openEditModal, openPingModal],
  )

  const pingCheck = useCallback(
    (pageId: number, profileId?: number, envId?: number) => {
      return dispatcher.pingCheck({ pageId, profileId, envId })
    },
    [dispatcher],
  )

  const menuProps = useMemo<IContextualMenuProps>(
    () => ({
      items: [
        {
          key: 'page',
          text: 'Page',
          iconProps: { iconName: 'desktop' },
          onClick: openCreatePageModal,
        },
      ],
    }),
    [openCreatePageModal],
  )

  const pingContent = useMemo(() => {
    return (
      <PingContent
        onClickCheck={pingCheck}
        page={page}
        pingResultMap={pingResultMap}
        profileMap={profileMap}
        envMap={envMap}
      />
    )
  }, [envMap, page, pingCheck, pingResultMap, profileMap])

  return (
    <div>
      <Stack horizontal horizontalAlign="end">
        <PrimaryButton text="Create" iconProps={{ iconName: 'plus' }} menuProps={menuProps} />
      </Stack>
      {!!pageRelationMap.size && <SettingCards items={pageList} onRenderCell={onRenderCell} />}
      {!!competitorList.length && (
        <>
          <Separator />
          <h3>Competitor Pages</h3>
        </>
      )}
      {!!pageRelationMap.size && <SettingCards items={competitorList} onRenderCell={onRenderCell} />}
      <TempPageList list={tempList} clickDeleteButton={openDeleteModal} />
      <SettingDialogs
        type={page.isCompetitor ? 'Competitor Page' : 'Page'}
        visible={visible}
        onCloseDialog={closeModal}
        editContent={<PageEditForm defaultPage={page} onSubmit={onUpdatePage} closeModal={closeModal} />}
        deleteContent={
          <DeleteContent
            type="page"
            name={page?.name ?? ''}
            progress={deleteProgress}
            onDelete={onDeletePage}
            closeModal={closeDeleteModal}
          />
        }
        isCreate={!page.id}
        pingContent={pingContent}
      />
    </div>
  )
}
