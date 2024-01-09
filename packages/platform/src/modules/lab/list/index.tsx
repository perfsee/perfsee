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

import { SelectOutlined } from '@ant-design/icons'
import { Stack, DocumentCard, TooltipHost } from '@fluentui/react'
import { useModule } from '@sigi/react'
import { useCallback, useEffect, FC, useState, useMemo } from 'react'

import { Pagination, useQueryString, useToggleState, ContentCard, Empty, ForeignLink } from '@perfsee/components'
import { SnapshotTrigger } from '@perfsee/schema'
import { staticPath } from '@perfsee/shared/routes'

import { SnapshotFilters, CreateSnapshot } from '../operator-comps/'
import { SnapshotTitle } from '../style'

import { SnapshotDrawer } from './drawer'
import { LabListModule, SnapshotSchema, ReportsPayload, SNAPSHOT_PAGE_SIZE } from './module'
import { CardsShimmer } from './shimmer'
import { SnapshotMeta } from './snapshot-meta'
import { SnapshotStatusTag } from './status-tag'
import { cardStyle, SnapshotListWrap, SnapshotCardHeader } from './style'

const tokens = {
  padding: '20px 0',
}

export const PaginationSnapshotList = () => {
  const [{ totalCount, loading }, dispatcher] = useModule(LabListModule)

  const [{ page = 1, trigger }, updateQueryString] = useQueryString<{
    page: number
    trigger: SnapshotTrigger
  }>()

  const noFilter = !trigger

  const onPageChange = useCallback(
    (page: number) => {
      updateQueryString({
        page,
      })
    },
    [updateQueryString],
  )

  const onTriggerFilterChange = useCallback(
    (value: string) => {
      updateQueryString({
        page: 1,
        trigger: value as SnapshotTrigger,
      })
    },
    [updateQueryString],
  )

  const onRenderHeader = useCallback(() => {
    return (
      <Stack horizontal horizontalAlign="space-between" verticalAlign="center" styles={{ root: { flexGrow: 1 } }}>
        <span>Lab Reports</span>
        <Stack horizontal verticalAlign="center" tokens={{ childrenGap: '16px' }}>
          <SnapshotFilters trigger={trigger} onChangeTrigger={onTriggerFilterChange} />
          <CreateSnapshot />
        </Stack>
      </Stack>
    )
  }, [onTriggerFilterChange, trigger])

  useEffect(() => {
    dispatcher.getSnapshots({
      trigger,
      pageNum: page,
      pageSize: SNAPSHOT_PAGE_SIZE,
    })
  }, [dispatcher, trigger, page])

  useEffect(() => {
    return dispatcher.reset
  }, [dispatcher])

  return (
    <ContentCard title="Lab Report" onRenderHeader={onRenderHeader}>
      {!loading && totalCount === 0 && noFilter ? (
        <Stack horizontalAlign="center" tokens={{ childrenGap: 12 }}>
          <Empty title="No Snapshot found" />
          <ForeignLink href={staticPath.docs.home + '/lab/get-started'}>
            See how to take a snapshot <SelectOutlined />
          </ForeignLink>
        </Stack>
      ) : (
        <>
          <SnapshotList trigger={trigger} />
          <Pagination
            page={page}
            total={totalCount}
            pageSize={SNAPSHOT_PAGE_SIZE}
            onChange={onPageChange}
            hideOnSinglePage={true}
          />
        </>
      )}
    </ContentCard>
  )
}

type Props = {
  trigger?: SnapshotTrigger
}

const SnapshotList: FC<Props> = (props) => {
  const [{ snapshots, reportsWithId, loading }, dispatcher] = useModule(LabListModule)

  const [{ snapshotId }, updateQueryString] = useQueryString<{ snapshotId?: string }>()
  const [panelVisible, showPanel, hidePanel] = useToggleState(!!snapshotId)
  const [activeSnapshotId, setActiveSnapshotId] = useState<number | null>(Number(snapshotId))

  const onClickItem = useCallback(
    (item: SnapshotSchema) => {
      setActiveSnapshotId(item.id)
      showPanel()
    },
    [showPanel],
  )

  const onHidePanel = useCallback(() => {
    setActiveSnapshotId(null)
    hidePanel()
  }, [hidePanel])

  useEffect(() => {
    updateQueryString({ snapshotId: activeSnapshotId ? `${activeSnapshotId}` : undefined })
  }, [activeSnapshotId, updateQueryString])

  const activeSnapshotLoaded = useMemo(() => {
    return !!snapshots.find((s) => s.id === activeSnapshotId)
  }, [snapshots, activeSnapshotId])

  const activeSnapshotReportsLoaded = useMemo(() => {
    return activeSnapshotId && (reportsWithId[activeSnapshotId] as ReportsPayload<false>)?.reports?.length
  }, [reportsWithId, activeSnapshotId])

  useEffect(() => {
    if (activeSnapshotId && !activeSnapshotReportsLoaded) {
      dispatcher.getSnapshotReports(activeSnapshotId)
    }
  }, [activeSnapshotId, dispatcher, activeSnapshotReportsLoaded])

  useEffect(() => {
    if (activeSnapshotId && !activeSnapshotLoaded) {
      dispatcher.getSnapshot({ snapshotId: activeSnapshotId })
    }
  }, [activeSnapshotId, dispatcher, activeSnapshotLoaded])

  if (loading) {
    return <CardsShimmer size={SNAPSHOT_PAGE_SIZE} />
  }

  if (!snapshots?.length) {
    if (props.trigger) {
      return (
        <Stack tokens={tokens} horizontalAlign="center">
          No snapshot created by {props.trigger}
        </Stack>
      )
    }

    return (
      <Stack tokens={tokens} horizontalAlign="center">
        No snapshot data.
      </Stack>
    )
  }

  return (
    <>
      <SnapshotListWrap>
        {snapshots.map((snapshot) => (
          <SnapshotItem key={snapshot.id} item={snapshot} onClick={onClickItem} />
        ))}
      </SnapshotListWrap>
      <SnapshotDrawer visible={panelVisible} snapshotId={activeSnapshotId} onClose={onHidePanel} />
    </>
  )
}

const SnapshotItem: FC<{
  item: SnapshotSchema
  onClick: (item: SnapshotSchema) => void
}> = ({ item, onClick }) => {
  const onClickCard = useCallback(() => {
    onClick(item)
  }, [item, onClick])

  return (
    <DocumentCard styles={cardStyle} onClick={onClickCard}>
      <SnapshotCardHeader>
        <SnapshotStatusTag status={item.status} />
        <TooltipHost
          content={item.title}
          styles={{
            root: {
              overflow: 'hidden',
              display: 'block',
            },
          }}
        >
          <SnapshotTitle>{item.title}</SnapshotTitle>
        </TooltipHost>
      </SnapshotCardHeader>
      <SnapshotMeta snapshot={item} />
    </DocumentCard>
  )
}
