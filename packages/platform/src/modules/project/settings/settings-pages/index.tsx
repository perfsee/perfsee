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

import { List, Separator, Stack } from '@fluentui/react'
import { useModule } from '@sigi/react'
import { useCallback, useMemo, useState, FC, useEffect } from 'react'

import { ColorButton, TooltipWithEllipsis } from '@perfsee/components'
import { SharedColors } from '@perfsee/dls'

import { DeleteProgress, PageSchema, PropertyModule, UpdatePagePayload } from '../../../shared'
import { emptyRelation } from '../helper'
import { DeleteContent, SettingDialogs, RightCreateButton, DialogVisible } from '../settings-common-comp'
import { NormalToken } from '../style'

import { CompetitorPageEditForm } from './competitor-page-edit-form'
import { PageEditForm } from './page-edit-form'
import { PageListCell } from './page-list-cell'

export const SettingsPages = () => {
  const [{ pages, hasCompetitorEnv, pageRelationMap, deleteProgress }, dispatcher] = useModule(PropertyModule, {
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

  const onCreatePage = useCallback(() => {
    setPage({ isCompetitor: false })
    setDialogVisible(DialogVisible.Edit)
  }, [])

  const onCreateCompetitor = useCallback(() => {
    setPage({ isCompetitor: true })
    setDialogVisible(DialogVisible.Edit)
  }, [])

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

  const { tempList, competitorList, disableList, pageList } = useMemo(() => {
    const tempList: PageSchema[] = []
    const competitorList: PageSchema[] = []
    const disableList: PageSchema[] = []
    const pageList: PageSchema[] = []
    pages.forEach((p) => {
      if (p.isE2e) {
        return
      }
      if (p.disable) {
        disableList.push(p)
      } else if (p.isCompetitor) {
        competitorList.push(p)
      } else if (p.isTemp) {
        tempList.push(p)
      } else {
        pageList.push(p)
      }
    })
    return { tempList, competitorList, disableList, pageList }
  }, [pages])

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
      <RightCreateButton text="Create Page" onClick={onCreatePage} />
      {!!pageRelationMap.size && <List items={pageList} onRenderCell={onRenderCell} />}
      <Separator />
      <RightCreateButton
        disabled={!hasCompetitorEnv}
        text="Create Competitor Page"
        tooltipContent="Create a competitor environment first."
        onClick={onCreateCompetitor}
      />
      {!!pageRelationMap.size && <List items={competitorList} onRenderCell={onRenderCell} />}
      <Separator />
      <h3>Disabled Pages</h3>
      {!!pageRelationMap.size && !!disableList.length && <List items={disableList} onRenderCell={onRenderCell} />}
      <TempPageList list={tempList} clickDeleteButton={openDeleteModal} />
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

type TempPageProps = {
  list: PageSchema[]
  clickDeleteButton: (item: PageSchema) => void
}
const TempPageList: FC<TempPageProps> = ({ list, clickDeleteButton }) => {
  const onClick = useCallback(
    (item: PageSchema) => {
      return () => clickDeleteButton(item)
    },
    [clickDeleteButton],
  )

  const onRenderTempCell = useCallback(
    (item?: PageSchema) => {
      if (!item) return null

      return (
        <Stack tokens={NormalToken} horizontal horizontalAlign="space-between" verticalAlign="center">
          <TooltipWithEllipsis content={item.url}>{item.url}</TooltipWithEllipsis>
          <ColorButton color={SharedColors.red10} onClick={onClick(item)}>
            Delete
          </ColorButton>
        </Stack>
      )
    },
    [onClick],
  )
  return (
    <>
      <Separator />
      <h3>Temporary Pages</h3>
      <List items={list} onRenderCell={onRenderTempCell} />
    </>
  )
}
