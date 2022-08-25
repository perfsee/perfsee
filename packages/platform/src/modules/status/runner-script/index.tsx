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

import { getTheme, SelectionMode, Stack } from '@fluentui/react'
import { useModule } from '@sigi/react'
import { useCallback, useEffect, useMemo } from 'react'

import { ColorButton, Table, TableColumnProps } from '@perfsee/components'
import { JobType } from '@perfsee/schema'
import { PrettyBytes } from '@perfsee/shared'

import { JobTypeSelector } from '../job-type-selector'

import { RunnerScriptModule, RunnerScript } from './module'
import { UploadButton } from './upload'

export const RunnerScriptManager = () => {
  const [state, dispatcher] = useModule(RunnerScriptModule)
  const theme = getTheme()

  useEffect(() => {
    dispatcher.fetchByJobType(JobType.BundleAnalyze)

    return () => dispatcher.reset()
  }, [dispatcher])

  const onChangeJobType = useCallback(
    (jobType: JobType) => {
      dispatcher.fetchByJobType(jobType)
    },
    [dispatcher],
  )

  const scriptTableColumns: TableColumnProps<RunnerScript>[] = useMemo(() => {
    return [
      {
        key: '',
        name: '',
        minWidth: 50,
        maxWidth: 50,
        onRender: (script) => {
          return state.activated?.version === script.version ? (
            <span title="Activated">⭐️</span>
          ) : script.enable ? (
            <></>
          ) : (
            <span title="Disabled">✖️</span>
          )
        },
      },
      {
        key: 'version',
        name: 'Version',
        minWidth: 100,
        maxWidth: 100,
        onRender: (script) => {
          return script.version
        },
      },
      {
        key: 'size',
        name: 'Size',
        minWidth: 100,
        maxWidth: 100,
        onRender: (script) => {
          return PrettyBytes.stringify(script.size)
        },
      },
      {
        key: 'description',
        name: 'Description',
        minWidth: 200,
        onRender: (script) => {
          return script.description
        },
      },
      {
        key: 'createdAt',
        name: 'Created At',
        minWidth: 200,
        maxWidth: 200,
        onRender: (script) => {
          return script.createdAt
        },
      },
      {
        key: 'op',
        name: 'Operations',
        minWidth: 250,
        maxWidth: 250,
        onRender: (script) => {
          const onClickDisable = () => {
            dispatcher.update({
              jobType: script.jobType,
              version: script.version,
              input: {
                enable: !script.enable,
              },
            })
          }
          return (
            <Stack horizontal tokens={{ childrenGap: 4 }}>
              {/* eslint-disable-next-line react/jsx-no-bind */}
              <ColorButton onClick={onClickDisable} color={theme.palette.red}>
                {script.enable ? 'Disable' : 'Enable'}
              </ColorButton>
              <a
                href={`${SERVER}/api/runners/scripts/${script.jobType}/${script.version}/download`}
                download={`${script.jobType}-${script.version}.tar.gz`}
              >
                <ColorButton color={theme.palette.green}>Download</ColorButton>
              </a>
            </Stack>
          )
        },
      },
    ]
  }, [dispatcher, state.activated?.version, theme.palette.green, theme.palette.red])

  return (
    <>
      <Stack tokens={{ childrenGap: 10 }}>
        <Stack tokens={{ childrenGap: 10 }} horizontal horizontalAlign="space-between" verticalAlign="end">
          <JobTypeSelector
            label="Job Type"
            jobType={state.jobType}
            onChange={onChangeJobType}
            styles={{ dropdown: { minWidth: 150 } }}
          />
          <UploadButton />
        </Stack>
        <p>
          <>Current Activated Version: {state.activated?.version}</>
        </p>
      </Stack>
      <Table selectionMode={SelectionMode.none} items={state.scripts} columns={scriptTableColumns} />
    </>
  )
}
