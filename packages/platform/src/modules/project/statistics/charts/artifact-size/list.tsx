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

import { BranchesOutlined, CalendarOutlined, NodeIndexOutlined } from '@ant-design/icons'
import { ConstrainMode, SelectionMode, Stack, Text } from '@fluentui/react'
import { useModuleState } from '@sigi/react'
import dayjs from 'dayjs'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'

import { ByteSizeWithDiff, NumberWithDiff } from '@perfsee/bundle-report/bundle-detail/components'
import { onRenderVerticalLineRow, Table, TableColumnProps, TooltipWithEllipsis } from '@perfsee/components'
import { InformationContainer } from '@perfsee/platform/modules/bundle/list/style'
import { Commit } from '@perfsee/platform/modules/components/commit'
import { ProjectInfo, useProject } from '@perfsee/platform/modules/shared'
import { pathFactory } from '@perfsee/shared/routes'

import { InfoItem, InfoRow } from '../../style'

import { Entrypoint, EntrypointsChartModule } from './module'

type EntrypointSchema = Entrypoint & {
  prev?: EntrypointSchema
  project: ProjectInfo
}

const entrypointsColumns: TableColumnProps<EntrypointSchema>[] = [
  {
    key: 'entrypoint',
    name: 'Entrypoint',
    minWidth: 150,
    maxWidth: 220,
    onRender: (data) => (
      <Stack>
        <Stack
          horizontal={true}
          verticalAlign="center"
          tokens={{
            childrenGap: 8,
          }}
        >
          <Link
            to={
              pathFactory.project.bundle.detail({
                projectId: data.project.id,
                bundleId: data.artifactId!,
              }) + `?entry=${data.entrypoint}`
            }
          >
            {data.entrypoint}
          </Link>
        </Stack>
        <Stack
          horizontal={true}
          verticalAlign="center"
          tokens={{
            childrenGap: 8,
          }}
        >
          <CalendarOutlined />
          <span>{dayjs(data.createdAt).format('MMM D, YYYY h:mm A')}</span>
        </Stack>
      </Stack>
    ),
  },
  {
    key: 'name',
    name: 'Artifact Name',
    minWidth: 100,
    maxWidth: 180,
    onRender: (data) => <TooltipWithEllipsis content={data.artifactName}>{data.artifactName}</TooltipWithEllipsis>,
  },
  {
    key: 'commit',
    name: 'Commit',
    minWidth: 160,
    maxWidth: 300,
    onRender: (data) => (
      <InformationContainer>
        <Stack horizontal={true} verticalAlign="center" tokens={{ childrenGap: 8 }}>
          <BranchesOutlined />
          <span>{data.branch}</span>
        </Stack>
        <Stack horizontal={true} verticalAlign="center" tokens={{ childrenGap: 8 }}>
          <NodeIndexOutlined />
          <Commit hash={data.hash} />
        </Stack>
      </InformationContainer>
    ),
  },
  {
    key: 'score',
    name: 'Score',
    minWidth: 80,
    maxWidth: 100,
    onRender: (data) =>
      data.score === null ? (
        <>No Score</>
      ) : (
        <NumberWithDiff current={data.score} baseline={data.prev?.score} hideIfNonComparable showPercentile={false} />
      ),
  },
  {
    key: 'size',
    name: 'Total Size',
    minWidth: 180,
    maxWidth: 300,
    onRender: (data) => {
      return <ByteSizeWithDiff current={data.size} baseline={data.prev?.size} hideIfNonComparable />
    },
  },
  {
    key: 'intialSize',
    name: 'Initial Size',
    minWidth: 180,
    maxWidth: 300,
    onRender: (data) => {
      return <ByteSizeWithDiff current={data.initialSize} baseline={data.prev?.initialSize} hideIfNonComparable />
    },
  },
]

export const EntrypointMetricsList = () => {
  const { entrypoints } = useModuleState(EntrypointsChartModule)
  const project = useProject()

  const data = useMemo(() => {
    return entrypoints?.slice().map((item, index, array) => ({
      ...item,
      project: project!,
      prev: array.find((entry, i) => i > index && entry.entrypoint === item.entrypoint) as EntrypointSchema,
    }))
  }, [project, entrypoints])

  if (!data || !data.length) {
    return null
  }

  return (
    <>
      <InfoRow align="center">
        <InfoItem>
          <Text variant="small">
            <b>{data.length} entrypoints found</b>
          </Text>
        </InfoItem>
      </InfoRow>
      <Table
        items={data}
        columns={entrypointsColumns}
        selectionMode={SelectionMode.none}
        onRenderRow={onRenderVerticalLineRow}
        constrainMode={ConstrainMode.unconstrained}
        detailsListStyles={{
          headerWrapper: { position: 'sticky', top: 0, zIndex: 1000 },
        }}
      />
    </>
  )
}
