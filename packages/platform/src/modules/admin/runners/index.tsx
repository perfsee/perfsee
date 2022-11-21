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

import { Stack, Spinner, SelectionMode, getTheme, IRenderFunction, IDetailsRowProps, DetailsRow } from '@fluentui/react'
import { useDispatchers, useModule } from '@sigi/react'
import { FC, useCallback, useEffect, useState } from 'react'

import {
  ContentCard,
  Empty,
  Pagination,
  Table,
  TableColumnProps,
  TooltipWithEllipsis,
  VerticalCenteredStyles,
} from '@perfsee/components'

import { RunnerActivateOperation } from './activation'
import { RunnerDeleteOperation } from './deletion'
import { RunnersFilter } from './filter'
import { JobTypeUpdater } from './job-type-updater'
import { Runner, RunnersModule } from './module'
import { RunnerStatusDot } from './style'

const runnerTableColumns: TableColumnProps<Runner>[] = [
  {
    key: 'status',
    name: '',
    minWidth: 20,
    maxWidth: 20,
    onRender: (runner) => {
      const theme = getTheme()
      const color = runner.online
        ? runner.runningJobs?.length
          ? theme.palette.blue
          : theme.palette.green
        : theme.palette.red

      return <RunnerStatusDot dotColor={color} />
    },
  },
  {
    key: 'id',
    name: 'id',
    fieldName: 'id',
    minWidth: 100,
    maxWidth: 300,
    onRender: (runner) => (
      <TooltipWithEllipsis width={240} content={runner.id}>
        {runner.id}
      </TooltipWithEllipsis>
    ),
  },
  {
    key: 'name',
    name: 'Name',
    minWidth: 100,
    maxWidth: 100,
    onRender: (runner) => {
      return <TooltipWithEllipsis content={runner.name}>{runner.name}</TooltipWithEllipsis>
    },
  },
  {
    key: 'zone',
    name: 'Zone',
    minWidth: 100,
    maxWidth: 100,
    fieldName: 'zone',
  },
  {
    key: 'load',
    name: 'Load',
    minWidth: 100,
    maxWidth: 100,
    onRender: (runner) => {
      return `${runner.runningJobCount} / ${runner.maxJobConcurrency}`
    },
  },
  {
    key: 'type',
    name: 'Assigned Job Type',
    minWidth: 200,
    maxWidth: 200,
    onRender: (runner) => {
      return <JobTypeUpdater runner={runner} />
    },
  },
  {
    key: 'op',
    name: 'Operations',
    minWidth: 200,
    maxWidth: 200,
    onRender: (runner) => {
      return (
        <Stack horizontal tokens={{ childrenGap: 4 }}>
          <RunnerActivateOperation runner={runner} />
          <RunnerDeleteOperation runner={runner} />
        </Stack>
      )
    },
  },
]

export const Runners = () => {
  const [state, dispatcher] = useModule(RunnersModule)

  useEffect(() => {
    dispatcher.fetchRunners()
  }, [dispatcher])

  const onPaginationChange = useCallback(
    (page: number, pageSize: number) => {
      dispatcher.setFilter({
        first: pageSize,
        skip: (page - 1) * pageSize,
      })
    },
    [dispatcher],
  )

  const onRenderRow: IRenderFunction<IDetailsRowProps> = useCallback((props) => {
    if (!props) {
      return null
    }

    return <RunnerRow {...props} />
  }, [])

  if (state.loading) {
    return <Spinner label="loading runners" />
  }

  return (
    <Stack tokens={{ childrenGap: 16 }}>
      <ContentCard>
        <RunnersFilter />
      </ContentCard>
      <ContentCard>
        <Stack grow>
          <Table
            selectionMode={SelectionMode.none}
            items={state.runners}
            columns={runnerTableColumns}
            onRenderRow={onRenderRow}
          />
          <Pagination
            hideOnSinglePage={false}
            total={state.runnerCount}
            onChange={onPaginationChange}
            pageSize={state.filter.first ?? 50}
            pageSizeOptions={[20, 50, 100]}
            showSizeChanger={true}
          />
        </Stack>
      </ContentCard>
    </Stack>
  )
}

const RunnerRow: FC<IDetailsRowProps> = (props) => {
  const [open, setOpen] = useState(false)
  const dispatcher = useDispatchers(RunnersModule)
  const runner = props.item as Runner

  useEffect(() => {
    if (!open) {
      return
    }

    if (!runner.runningJobs || runner.runningJobCount !== runner.runningJobs.length) {
      dispatcher.fetchRunnerRunningJobs(runner.id)
    }
  }, [dispatcher, open, runner])

  const onClick = useCallback(() => {
    setOpen((open) => !open)
  }, [])

  const jobs = !open ? null : runner.runningJobs ? (
    runner.runningJobs.length ? (
      <ol>
        {runner.runningJobs.map((job, i) => {
          return (
            <li key={i}>
              {job.jobType} - {Date.now() - new Date(job.startedAt ?? Date.now()).getTime()}ms - {job.createdAt}
            </li>
          )
        })}
      </ol>
    ) : (
      <Empty withIcon={true} title="No running jobs" />
    )
  ) : (
    <Spinner label="loading running jobs" />
  )

  return (
    <>
      <DetailsRow {...props} styles={VerticalCenteredStyles} onClick={onClick} />
      {jobs}
    </>
  )
}
