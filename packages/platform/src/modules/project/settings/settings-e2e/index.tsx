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

import { useModule } from '@sigi/react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { DeleteProgress, PageSchema, PropertyModule, UpdatePagePayload } from '../../../shared'
import { SettingCards } from '../cards'
import { emptyRelation } from '../helper'
import { DialogVisible, RightCreateButton, SettingDialogs, DeleteContent } from '../settings-common-comp'
import { PageEditForm } from '../settings-pages/page-edit-form'
import { PageListCell } from '../settings-pages/page-list-cell'

export const SettingsE2e = () => {
  const [{ pages, pageRelationMap, deleteProgress }, dispatcher] = useModule(PropertyModule, {
    selector: (state) => ({
      pages: state.pages,
      pageRelationMap: state.pageRelationMap,
      deleteProgress: state.deleteProgress.page,
    }),
    dependencies: [],
  })

  const [visible, setDialogVisible] = useState<DialogVisible>(DialogVisible.Off)
  const [e2eTest, setE2eTest] = useState<Partial<PageSchema>>({})

  useEffect(() => {
    dispatcher.fetchPageRelation()
  }, [dispatcher])

  const onCreateE2eTest = useCallback(() => {
    setE2eTest({ isE2e: true })
    setDialogVisible(DialogVisible.Edit)
  }, [])

  const openEditModal = useCallback((e2e?: PageSchema) => {
    if (e2e) {
      setE2eTest(e2e)
      setDialogVisible(DialogVisible.Edit)
    }
  }, [])

  const openDeleteModal = useCallback((e2e: PageSchema) => {
    setE2eTest(e2e)
    setDialogVisible(DialogVisible.Delete)
  }, [])

  const onClickRestore = useCallback(
    (page: PageSchema) => {
      dispatcher.updateOrCreatePage({
        page: { ...page, disable: false },
        relation: pageRelationMap.get(page.id) ?? emptyRelation,
      })
    },
    [dispatcher, pageRelationMap],
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

  const closeModal = useCallback(() => {
    setDialogVisible(DialogVisible.Off)
  }, [])

  const closeDeleteModal = useCallback(() => {
    closeModal()
    dispatcher.setDeleteProgress({ type: 'page', progress: DeleteProgress.None })
  }, [closeModal, dispatcher])

  const onUpdate = useCallback(
    (payload: UpdatePagePayload) => {
      dispatcher.updateOrCreatePage(payload)
      closeModal()
    },
    [closeModal, dispatcher],
  )

  const onDeletePage = useCallback(() => {
    e2eTest.id && dispatcher.deletePage(e2eTest.id)
  }, [dispatcher, e2eTest])

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

  const editContent = useMemo(() => {
    return <PageEditForm defaultPage={e2eTest} onSubmit={onUpdate} closeModal={closeModal} />
  }, [closeModal, e2eTest, onUpdate])

  const deleteContent = useMemo(() => {
    return (
      <DeleteContent
        type="e2e test"
        name={e2eTest?.name ?? ''}
        progress={deleteProgress}
        onDelete={onDeletePage}
        closeModal={closeDeleteModal}
      />
    )
  }, [e2eTest?.name, deleteProgress, onDeletePage, closeDeleteModal])

  const e2ePages = useMemo(() => pages.filter((page) => page.isE2e), [pages])

  return (
    <div>
      <RightCreateButton text="Create a new E2E test" onClick={onCreateE2eTest} />
      {!!pageRelationMap.size && <SettingCards items={e2ePages} onRenderCell={onRenderCell} />}

      <SettingDialogs
        type={'E2E Test'}
        onCloseDialog={closeModal}
        editContent={editContent}
        deleteContent={deleteContent}
        visible={visible}
        isCreate={!e2eTest.id}
      />
    </div>
  )
}
