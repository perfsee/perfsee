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

import { DefaultButton, Spinner, SpinnerSize, Text } from '@fluentui/react'
import { useModule } from '@sigi/react'
import { useCallback, useEffect, useRef } from 'react'
import { useParams } from 'react-router'

import { JobType } from '@perfsee/schema'
import { RouteTypes } from '@perfsee/shared/routes'

import { useProject } from '../shared'

import { JobTraceModule } from './module'
import { Log, LogsWrapper, PageWrapper } from './style'

export const Trace = () => {
  const project = useProject()
  const { type, entityId } = useParams<RouteTypes['project']['jobTrace']>()
  const [state, dispatcher] = useModule(JobTraceModule)
  const scrollableRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (project) {
      dispatcher.getJobTrace({
        projectId: project.id,
        type: type as JobType,
        entityId,
      })
    }

    return dispatcher.dispose$
  }, [dispatcher, type, entityId, project])

  const collapseAll = useCallback(() => {
    if (scrollableRef.current) {
      scrollableRef.current.querySelectorAll('input[type="checkbox"]').forEach((el) => {
        ;(el as HTMLInputElement).checked = false
      })
    }
  }, [])

  if (!state.logs) {
    return <Spinner label="loading" />
  }

  if (state.logs.length === 0) {
    return (
      <div style={{ textAlign: 'center' }}>
        <Text variant="large">No Logs</Text>
      </div>
    )
  }

  return (
    <PageWrapper>
      <DefaultButton onClick={collapseAll} styles={{ root: { marginBottom: 8 } }}>
        Collapse All
      </DefaultButton>
      <LogsWrapper ref={scrollableRef}>
        {state.logs.map((log) => (
          <Log log={log} key={log.id} />
        ))}
        {state.hasMore && <Spinner size={SpinnerSize.small} />}
      </LogsWrapper>
    </PageWrapper>
  )
}
