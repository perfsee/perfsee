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
import { ApiOutlined, DeleteOutlined, EditOutlined, RollbackOutlined, StopOutlined } from '@ant-design/icons'
import { IContextualMenuProps, PrimaryButton, Separator, Stack, Toggle, TooltipHost } from '@fluentui/react'
import { useModule } from '@sigi/react'
import { compact } from 'lodash'
import { useCallback, useMemo, useState, useEffect } from 'react'

import { DeleteProgress, PageSchema, PropertyModule, UpdatePagePayload } from '../../../shared'
import { SettingCards, SettingTable } from '../cards'
import { emptyRelation } from '../helper'
import { DeleteContent, DialogVisible, SettingDialogs } from '../settings-common-comp'

import { PageEditForm } from './page-edit-form'
import { PageListCell } from './page-list-cell'
import { PingContent } from './ping-content'
import { TextWithStatus } from './style'
import { TempPageList } from './temp-list'

export const SettingsPages = () => {
  const [{ pages, pageRelationMap, pingResultMap, deleteProgress, envMap, profileMap, pageMap }, dispatcher] =
    useModule(PropertyModule, {
      selector: (state) => ({
        pages: state.pages,
        pageRelationMap: state.pageRelationMap,
        deleteProgress: state.deleteProgress.page,
        envMap: state.envMap,
        profileMap: state.profileMap,
        pingResultMap: state.pingResultMap,
        pageMap: state.pageMap,
      }),
      dependencies: [],
    })

  useEffect(() => {
    dispatcher.fetchPageRelation()
  }, [dispatcher])

  const [page, setPage] = useState<Partial<PageSchema>>({})
  const [visible, setDialogVisible] = useState<DialogVisible>(DialogVisible.Off)
  const [isCard, setIsCard] = useState(true)

  const { tempList, competitorList, pageList } = useMemo(() => {
    const tempList: PageSchema[] = []
    const competitorList: PageSchema[] = []
    const pageList: PageSchema[] = []
    pages.forEach((p) => {
      if (p.isTemp) {
        tempList.push(p)
      } else if (p.isCompetitor) {
        competitorList.push(p)
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

  const onToggle = useCallback(() => {
    setIsCard((v) => !v)
  }, [])

  const onEditClick = useCallback((item: PageSchema) => () => openEditModal(item), [openEditModal])
  const onDeleteClick = useCallback((item: PageSchema) => () => openDeleteModal(item), [openDeleteModal])
  const onDisableClick = useCallback((item: PageSchema) => () => onClickDisable(item), [onClickDisable])
  const onRestoreClick = useCallback((item: PageSchema) => () => onClickRestore(item), [onClickRestore])
  const onPingClick = useCallback((item: PageSchema) => () => openPingModal(item), [openPingModal])

  const defaultTableColumns = useMemo(() => {
    return [
      {
        key: 'name',
        name: 'Page',
        minWidth: 120,
        onRender: (item: PageSchema) => (
          <TextWithStatus disable={item.disable}>
            <TooltipHost content={item.name}>{item.name}</TooltipHost>
          </TextWithStatus>
        ),
        sorter: (a: PageSchema, b: PageSchema) => a.name.localeCompare(b.name),
      },
      {
        key: 'env',
        name: 'Env',
        minWidth: 130,
        onRender: (item: PageSchema) => {
          const relation = pageRelationMap.get(item.id)
          if (!relation || !relation.envIds.length) {
            return '-'
          }
          const envs = compact(relation.envIds.map((envId) => envMap.get(envId)?.name))
          const content = envs.join(', ')
          return (
            <TextWithStatus disable={item.disable}>
              <TooltipHost content={content}>{content}</TooltipHost>
            </TextWithStatus>
          )
        },
      },
      {
        key: 'profile',
        name: 'Profile',
        minWidth: 130,
        onRender: (item: PageSchema) => {
          const relation = pageRelationMap.get(item.id)
          if (!relation || !relation.profileIds.length) {
            return '-'
          }
          const profiles = compact(relation.profileIds.map((id) => profileMap.get(id)?.name))
          const content = profiles.join(', ')
          return (
            <TextWithStatus disable={item.disable}>
              <TooltipHost content={content}>{content}</TooltipHost>
            </TextWithStatus>
          )
        },
      },
    ]
  }, [envMap, pageRelationMap, profileMap])

  const competitorTableColumns = useMemo(() => {
    return defaultTableColumns.concat([
      {
        key: 'connect',
        name: 'Connect Page',
        minWidth: 130,
        onRender: (item) => {
          const connectIds =
            [...pageRelationMap.values()]
              .filter((relation) => {
                return relation.competitorIds.includes(item.id as number)
              })
              ?.map((relation) => relation.pageId) || []

          if (!connectIds.length) {
            return '-'
          }
          const cs = compact(connectIds.map((id) => pageMap.get(id)?.name))
          const content = cs.join(', ')
          return (
            <TextWithStatus disable={item.disable}>
              <TooltipHost content={content}>{content}</TooltipHost>
            </TextWithStatus>
          )
        },
      },
    ])
  }, [defaultTableColumns, pageMap, pageRelationMap])

  const tableColumns = useMemo(() => {
    return competitorList.length
      ? defaultTableColumns.concat([
          {
            key: 'competitor',
            name: 'Competitor',
            minWidth: 130,
            onRender: (item) => {
              const relation = pageRelationMap.get(item.id)
              if (!relation || !relation.competitorIds.length) {
                return '-'
              }
              const cs = compact(relation.competitorIds.map((id) => pageMap.get(id)?.name))
              const content = cs.join(', ')
              return (
                <TextWithStatus disable={item.disable}>
                  <TooltipHost content={content}>{content}</TooltipHost>
                </TextWithStatus>
              )
            },
          },
        ])
      : defaultTableColumns
  }, [competitorList.length, defaultTableColumns, pageMap, pageRelationMap])

  const operatorColumns = useMemo(() => {
    return [
      {
        key: 'operator',
        name: 'Operator',
        minWidth: 100,
        maxWidth: 120,
        onRender: (item: PageSchema) => {
          return (
            <Stack horizontal tokens={{ childrenGap: 8 }}>
              <TooltipHost content="Edit">
                <EditOutlined onClick={onEditClick(item)} />
              </TooltipHost>
              <TooltipHost content="Ping">
                <ApiOutlined onClick={onPingClick(item)} />
              </TooltipHost>
              <TooltipHost content={item.disable ? 'Enable' : 'Disable'}>
                {!item.disable && <StopOutlined onClick={onDisableClick(item)} />}
                {item.disable && <RollbackOutlined onClick={onRestoreClick(item)} />}
              </TooltipHost>
              <TooltipHost content="Delete">
                <DeleteOutlined style={{ color: 'red' }} onClick={onDeleteClick(item)} />
              </TooltipHost>
            </Stack>
          )
        },
      },
    ]
  }, [onDeleteClick, onDisableClick, onEditClick, onPingClick, onRestoreClick])

  return (
    <div>
      <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
        <Toggle
          styles={{ root: { margin: '0 4px 0 0' } }}
          onText="Card"
          offText="List"
          checked={isCard}
          onClick={onToggle}
        />
        <PrimaryButton text="Create" iconProps={{ iconName: 'plus' }} menuProps={menuProps} />
      </Stack>
      {!!pageRelationMap.size &&
        (isCard ? (
          <SettingCards items={pageList} onRenderCell={onRenderCell} />
        ) : (
          <SettingTable items={pageList} columns={tableColumns.concat(operatorColumns)} />
        ))}
      {!!competitorList.length && (
        <>
          {isCard ? <Separator /> : <Stack tokens={{ padding: 10 }} />}
          <h3>Competitor Pages</h3>
        </>
      )}

      {!!pageRelationMap.size &&
        !!competitorList.length &&
        (isCard ? (
          <SettingCards items={competitorList} onRenderCell={onRenderCell} />
        ) : (
          <SettingTable items={competitorList} columns={competitorTableColumns.concat(operatorColumns)} />
        ))}

      {tempList.length ? isCard ? <Separator /> : <Stack tokens={{ padding: 10 }} /> : null}
      {tempList.length ? <TempPageList list={tempList} clickDeleteButton={openDeleteModal} /> : null}
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
