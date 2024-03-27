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

import { DefaultButton, IPivotItemProps, Pivot, PivotItem, Spinner, SpinnerSize, Stack, Text } from '@fluentui/react'
import { useModule } from '@sigi/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router'

import { JobStatus, JobType } from '@perfsee/schema'
import { RouteTypes } from '@perfsee/shared/routes'

import { useProject } from '../shared'

import { JobTraceModule } from './module'
import { JobStatusTag } from './status-tag'
import { Log, LogsWrapper, PageWrapper } from './style'

export interface TraceProps {
  type?: string
  entityId?: string
  onlyPicked?: boolean
}

function nth(n: number) {
  return n + (['st', 'nd', 'rd'][((((n + 90) % 100) - 10) % 10) - 1] || 'th')
}

export const Trace = (props: TraceProps) => {
  const project = useProject()
  const { type = props.type, entityId = props.entityId } = useParams<RouteTypes['project']['jobTrace']>()
  const [state, dispatcher] = useModule(JobTraceModule)
  const scrollableRef = useRef<HTMLDivElement>(null)
  const [selectJob, setSelectedJob] = useState(0)

  useEffect(() => {
    if (project) {
      dispatcher.getJobs({
        projectId: project.id,
        type: type as JobType,
        entityId: entityId!,
      })
    }

    return dispatcher.reset
  }, [dispatcher, type, entityId, project])

  const defaultJob = useMemo(() => {
    return (
      state.jobs.find((j) => j.extra?.['picked']) ||
      state.jobs.find((j) => j.status === JobStatus.Done) ||
      state.jobs.find((j) => j.status === JobStatus.Running) ||
      state.jobs[0]
    )?.id
  }, [state.jobs])

  useEffect(() => {
    if (state.jobs.length && project) {
      if (props.onlyPicked) {
        dispatcher.getJobTrace({
          projectId: project.id,
          type: type as JobType,
          jobId: defaultJob,
        })
      }

      dispatcher.getJobTrace({
        projectId: project.id,
        type: type as JobType,
        jobId: state.jobs.find((j) => j.id === selectJob)?.id || defaultJob,
      })
    }

    return dispatcher.resetTrace
  }, [dispatcher, state.jobs, type, project, props.onlyPicked, selectJob, defaultJob])

  const onClickJob = useCallback((item?: PivotItem) => {
    if (item?.props.itemKey) {
      setSelectedJob(Number(item.props.itemKey))
    }
  }, [])

  const customPivotRenderer = useCallback(
    (link?: IPivotItemProps, defaultRenderer?: (link?: IPivotItemProps) => JSX.Element | null) => {
      if (!link || !defaultRenderer) {
        return null
      }

      return (
        <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 8 }}>
          {defaultRenderer({ ...link })}
          {link.ariaLabel ? <JobStatusTag status={link.ariaLabel as any} /> : null}
        </Stack>
      )
    },
    [],
  )

  const collapseAll = useCallback(() => {
    if (scrollableRef.current) {
      scrollableRef.current.querySelectorAll('input[type="checkbox"]').forEach((el) => {
        ;(el as HTMLInputElement).checked = false
      })
    }
  }, [])

  if (!state.jobs.length) {
    return <Spinner label="loading" />
  }

  const logs = (
    <PageWrapper>
      <DefaultButton onClick={collapseAll} styles={{ root: { marginBottom: 8 } }}>
        Collapse All
      </DefaultButton>
      <LogsWrapper ref={scrollableRef}>
        {state.logs?.length ? (
          state.logs.map((log) => <Log log={log} key={log.id} />)
        ) : (
          <div style={{ textAlign: 'center' }}>
            <Text variant="large">No Logs</Text>
          </div>
        )}
        {state.hasMore && <Spinner size={SpinnerSize.small} />}
      </LogsWrapper>
    </PageWrapper>
  )

  if (props.onlyPicked) {
    return logs
  }

  return (
    <Stack>
      <Pivot onLinkClick={onClickJob} defaultSelectedKey={String(defaultJob)}>
        {state.jobs.map((job, i) => (
          <PivotItem
            itemKey={String(job.id)}
            headerText={nth(state.jobs.length - i) + ' Run'}
            key={job.id}
            onRenderItemLink={customPivotRenderer}
            ariaLabel={job.extra?.['picked'] ? 'Picked' : job.status !== JobStatus.Done ? job.status : undefined}
          />
        ))}
      </Pivot>
      {logs}
    </Stack>
  )
}
