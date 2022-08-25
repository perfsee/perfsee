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

import { AuditOutlined, BranchesOutlined, NodeIndexOutlined } from '@ant-design/icons'
import { IComboBoxOption, NeutralColors, Stack } from '@fluentui/react'
import { useModuleState } from '@sigi/react'
import dayjs from 'dayjs'
import { FC, memo, useCallback, useMemo } from 'react'

import { Select } from '@perfsee/components'
import { getCommitLink } from '@perfsee/shared'

import { VersionTag } from '../../project/statistics/style'
import { ProjectModule } from '../../shared'
import { Artifact, EntryPointSchema, VersionSnapshotReport } from '../types'

import { ReportIconWrap, CreatedAtWrap } from './styled'

type Props = {
  artifact?: Artifact | null
  entry?: EntryPointSchema
  entryPoints: EntryPointSchema[]
  hash: string
  report?: VersionSnapshotReport
  reports: VersionSnapshotReport[]
  onEntryChange: (entry: EntryPointSchema) => void
  onReportChange: (id: number) => void
}

export const BaseInfo: FC<Props> = memo((props) => {
  const { artifact, hash, reports, report, onReportChange, entryPoints, entry, onEntryChange } = props

  const { project } = useModuleState(ProjectModule)

  const onChange = useCallback(
    (_e: any, option?: IComboBoxOption) => {
      if (option) {
        onReportChange(option.key as number)
      }
    },
    [onReportChange],
  )

  const onEntryPointChange = useCallback(
    (_e: any, option?: IComboBoxOption) => {
      if (option) {
        onEntryChange(option.data as EntryPointSchema)
      }
    },
    [onEntryChange],
  )

  const reportOptions = useMemo(() => {
    return reports.map((r) => {
      return {
        key: r.id,
        text: `#${r.id} ${r.page.name} * ${r.profile.name} * ${r.environment.name}`,
      }
    })
  }, [reports])

  const entryOptions = useMemo(() => {
    return entryPoints.map((e) => ({ key: e.entrypoint, text: e.entrypoint, data: e }))
  }, [entryPoints])

  if (!project) {
    return null
  }

  return (
    <>
      <Stack horizontal tokens={{ childrenGap: '12px', padding: '16px 0 24px' }}>
        <ReportIconWrap>
          <AuditOutlined />
        </ReportIconWrap>
        <Stack styles={{ root: { flex: 1 } }}>
          <Stack horizontal horizontalAlign="space-between">
            <div>
              <b style={{ fontSize: '16px', marginRight: '8px' }}>Commit</b>
              <VersionTag>{hash.slice(0, 8)}</VersionTag>
            </div>
            <Stack horizontal tokens={{ childrenGap: '8px' }}>
              <Select
                title="Entry"
                selectedKey={entry?.entrypoint}
                options={entryOptions}
                onChange={onEntryPointChange}
              />
              <Select title="Report" selectedKey={report?.id} options={reportOptions} onChange={onChange} />
            </Stack>
          </Stack>
          {artifact && (
            <Stack
              styles={{
                root: {
                  '& > :not(:last-child)': { borderRight: `1px solid ${NeutralColors.gray30}`, paddingRight: '10px' },
                },
              }}
              horizontal
              tokens={{ childrenGap: '12px' }}
            >
              <CreatedAtWrap>{dayjs(artifact.createdAt).format('YYYY/MM/DD HH:mm:ss')}</CreatedAtWrap>
              <Stack horizontal verticalAlign="center" tokens={{ childrenGap: '4px' }}>
                <BranchesOutlined />
                <span>{artifact.branch}</span>
              </Stack>
              <a href={getCommitLink(project, artifact.hash)} target="_blank" rel="noopener">
                <Stack horizontal verticalAlign="center" tokens={{ childrenGap: '4px' }}>
                  <NodeIndexOutlined />
                  <span>{artifact.hash.slice(0, 8)}</span>
                </Stack>
              </a>
            </Stack>
          )}
        </Stack>
      </Stack>
    </>
  )
})
