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

import { Stack } from '@fluentui/react'
import { useModuleState } from '@sigi/react'
import { FC } from 'react'

import { SnapshotStatus } from '@perfsee/schema'

import { Commit } from '../../components/commit'
import { ProjectModule } from '../../shared'
import { StatusText } from '../style'

import { SnapshotSchema } from './module'
import { InfoTitle, InfoText } from './style'

interface Props {
  snapshot: SnapshotSchema
}
export const SnapshotMeta: FC<Props> = ({ snapshot }) => {
  const { project } = useModuleState(ProjectModule)

  if (!project) {
    return null
  }

  return (
    <Stack tokens={{ padding: '12px', childrenGap: '4px' }}>
      <div>
        <InfoTitle>Commit: </InfoTitle>
        <InfoText>{snapshot.hash ? <Commit hash={snapshot.hash} /> : 'unknown'}</InfoText>
      </div>
      <div>
        <InfoTitle>Created at: </InfoTitle>
        <InfoText>{new Date(snapshot.createdAt).toLocaleString()}</InfoText>
      </div>
      <div>
        <InfoTitle>Created by: </InfoTitle>
        <InfoText>{snapshot.trigger}</InfoText>
      </div>
      <div>
        <InfoTitle>Reports: </InfoTitle>
        <InfoText>
          {Object.entries(snapshot.reportsStatusCount).map(([status, count]) => {
            if (typeof count === 'number' && count > 0) {
              return (
                <span key={status}>
                  <StatusText status={status as SnapshotStatus} size="small">
                    {count} {status}{' '}
                  </StatusText>
                </span>
              )
            }
            return null
          })}
        </InfoText>
      </div>
    </Stack>
  )
}
