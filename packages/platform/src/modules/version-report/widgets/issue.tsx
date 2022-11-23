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

import { DoubleRightOutlined } from '@ant-design/icons'
import { Spinner, SpinnerSize, SelectionMode, TooltipHost } from '@fluentui/react'
import { useModuleState } from '@sigi/react'
import { startCase } from 'lodash'
import { FC, useMemo, useCallback } from 'react'
import { useHistory, useParams } from 'react-router'

import { Table, TableColumnProps, TooltipWithEllipsis } from '@perfsee/components'
import { formatTime } from '@perfsee/platform/common'
import { pathFactory } from '@perfsee/shared/routes'

import { ProjectModule, useProjectRouteGenerator } from '../../shared'
import { SourceIssue, VersionIssue } from '../types'

import { IssueWrap } from './styled'

interface Props {
  issue: VersionIssue | null
}

export const IssueInfo: FC<Props> = ({ issue }) => {
  const { project } = useModuleState(ProjectModule)
  const history = useHistory()
  const { hash } = useParams<{ hash: string }>()
  const generateProjectRoute = useProjectRouteGenerator()

  const onClickSourceIssue = useCallback(
    (item: SourceIssue) => () => {
      if (project) {
        history.push(generateProjectRoute(pathFactory.project.source, {}, { hash, focusId: item.id }))
      }
    },
    [project, history, generateProjectRoute, hash],
  )

  const columns: TableColumnProps<SourceIssue>[] = useMemo(
    () => [
      {
        key: 'function',
        name: 'Function',
        minWidth: 100,
        maxWidth: 100,
        onRender: (item: SourceIssue) => {
          return <TooltipWithEllipsis content={item.frameKey.substring(0, item.frameKey.indexOf(':'))} />
        },
      },
      {
        key: 'file',
        name: 'File',
        minWidth: 200,
        onRender: (item: SourceIssue) => {
          return <TooltipWithEllipsis content={item.frameKey.substring(item.frameKey.indexOf(':') + 1)} />
        },
      },
      {
        key: 'code',
        name: 'Code',
        minWidth: 150,
        maxWidth: 200,
        onRender: (item: SourceIssue) => {
          return startCase(item.code)
        },
      },
      {
        key: 'time',
        name: 'Time',
        minWidth: 70,
        maxWidth: 70,
        onRender: (item: SourceIssue) => {
          if (item.info?.unit !== 'us') return 'Unknown time format'
          const formatted = formatTime(item.info?.value / 1000)
          return formatted.value + formatted.unit
        },
      },
      {
        key: 'operations',
        name: '',
        minWidth: 100,
        maxWidth: 100,
        onRender: (item: SourceIssue) => {
          return (
            <TooltipHost content="View Detail">
              <DoubleRightOutlined onClick={onClickSourceIssue(item)} />
            </TooltipHost>
          )
        },
      },
    ],
    [onClickSourceIssue],
  )

  if (!issue) {
    return <>no issue</>
  }

  if (issue.loading) {
    return <Spinner size={SpinnerSize.large} label="Loading Issues" />
  }

  return (
    <IssueWrap>
      <Table
        items={issue.issues}
        enableShimmer={issue.loading}
        columns={columns}
        selectionMode={SelectionMode.none}
        shimmerLines={10}
        detailsListStyles={{
          headerWrapper: { '> div[role=row]': { paddingTop: 0 } },
        }}
      />
    </IssueWrap>
  )
}
