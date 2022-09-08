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

import { IconButton, IIconProps, SelectionMode, Stack, TooltipHost } from '@fluentui/react'
import { useModule } from '@sigi/react'
import { groupBy } from 'lodash'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { useHistory } from 'react-router'
import { Link } from 'react-router-dom'

import { Table, TableColumnProps } from '@perfsee/components'
import { PrettyBytes } from '@perfsee/platform/common'
import { useProject } from '@perfsee/platform/modules/shared'
import { Size } from '@perfsee/shared'
import { pathFactory } from '@perfsee/shared/routes'

import { ArtifactNameSelector, BranchSelector } from '../../components'
import { useGenerateProjectRoute } from '../../shared'

import { BarChart } from './components/barchart'
import { LoadMore } from './components/load-more'
import { BundleEntrypoint, StatisticsModule } from './module'
import { ArtifactLabel, ChartPartHeader, ChartPartWrap, tableHeaderStyles } from './style'

type BundleAggregation = {
  entrypoint: React.ReactNode
  data: BundleEntrypoint[]
}

const detailIconProps: IIconProps = {
  iconName: 'DoubleRightOutlined',
}

const formatSize = (size: number) => {
  return PrettyBytes.create(size).toString()
}

const BARCHART_LENGTH = 15
const ArtifactSizeHistoryBarChart = memo<{
  history: BundleEntrypoint[]
  title: string
  propertyName: keyof Size
}>(({ history, title, propertyName }) => {
  const generateProjectRoute = useGenerateProjectRoute()

  const onRenderArtifactId = useCallback(
    (id: number) => (
      <>
        Artifact <Link to={generateProjectRoute(pathFactory.project.bundle.detail, { bundleId: id })}>#{id}</Link>
      </>
    ),
    [generateProjectRoute],
  )

  return (
    <BarChart
      title={title}
      items={history.slice(-15).map((artifact) => {
        const value = artifact.size?.[propertyName]
        return {
          type: value ? 'success' : 'missing',
          value,
          id: artifact.artifactId,
          date: artifact.createdAt,
        }
      })}
      minLength={BARCHART_LENGTH}
      onRenderId={onRenderArtifactId}
      valueFormatter={formatSize}
    />
  )
})

const artifactColumns: TableColumnProps<BundleAggregation>[] = [
  {
    key: 'entrypoint',
    name: 'Entry Point',
    minWidth: 220,
    onRender: (item) => {
      return <a>{item.entrypoint}</a>
    },
  },
  {
    key: 'raw',
    name: 'Bundle Size',
    minWidth: 250,
    maxWidth: 250,
    onRender: ({ data }) => {
      return <ArtifactSizeHistoryBarChart title="Bundle Size" history={data} propertyName="raw" />
    },
  },
  {
    key: 'gzip',
    name: 'gzip',
    minWidth: 250,
    maxWidth: 250,
    onRender: ({ data }) => {
      return <ArtifactSizeHistoryBarChart title="Gzip Size" history={data} propertyName="gzip" />
    },
  },
  {
    key: 'brotli',
    name: 'brotli',
    minWidth: 250,
    maxWidth: 250,
    onRender: ({ data }) => {
      return <ArtifactSizeHistoryBarChart title="Brotli Size" history={data} propertyName="brotli" />
    },
  },
  {
    key: 'detail',
    name: '',
    minWidth: 50,
    maxWidth: 50,
    onRender: () => {
      return (
        <TooltipHost key="detail" content="View Detail">
          <IconButton iconProps={detailIconProps} />
        </TooltipHost>
      )
    },
  },
]

export const ArtifactSize = () => {
  const [loadMore, setLoadMore] = useState(false)
  const project = useProject()
  const generateProjectRoute = useGenerateProjectRoute()
  const [{ bundleHistory }, dispatcher] = useModule(StatisticsModule, {
    selector: (state) => ({ bundleHistory: state.bundleHistory }),
    dependencies: [],
  })
  const [branch, setBranch] = useState<string>()
  const [artifactName, setArtifactName] = useState<string>()

  useEffect(() => {
    if (branch) {
      dispatcher.getAggregatedArtifacts({ length: 15, from: null, to: null, branch, name: artifactName ?? null })
    }
  }, [dispatcher, branch, artifactName])

  const history = useHistory()

  const aggregatedBundle = useMemo(() => {
    if (!bundleHistory) {
      return null
    }

    const groupped = Object.entries(groupBy(bundleHistory, 'artifactName')).map(([artifactName, data]) => ({
      artifactName,
      data,
    }))

    return groupped
      .map((group) => {
        return Object.entries(groupBy(group.data, 'entrypoint')).map(([entrypoint, data]) => ({
          // append artifact name before entries
          entrypoint:
            groupped.length > 1 ? (
              <>
                <ArtifactLabel>{group.artifactName}</ArtifactLabel>
                {entrypoint}
              </>
            ) : (
              entrypoint
            ),
          data: data.sort((a, b) => a.artifactId - b.artifactId),
        }))
      })
      .flat()
  }, [bundleHistory])

  const handleRowClick = useCallback(
    (item: BundleAggregation) => {
      const name = item.data[0]?.artifactName
      const path = generateProjectRoute(
        pathFactory.project.statistics.artifacts,
        {},
        { branch, name: name ?? artifactName ?? null },
      )
      history.push(path)
    },
    [generateProjectRoute, branch, artifactName, history],
  )

  const handleLoadMore = useCallback(() => {
    setLoadMore(true)
  }, [])

  if (!project) {
    return null
  }

  return (
    <ChartPartWrap>
      <ChartPartHeader>
        <span>Bundle Size</span>
        <Stack horizontal tokens={{ childrenGap: '10px' }}>
          <ArtifactNameSelector onChange={setArtifactName} />
          <BranchSelector defaultBranch={branch} shouldAutoSelect onChange={setBranch} />
        </Stack>
      </ChartPartHeader>
      <Table
        items={(loadMore ? aggregatedBundle : aggregatedBundle?.slice(0, 5)) ?? []}
        columns={artifactColumns}
        selectionMode={SelectionMode.none}
        onRowClick={handleRowClick}
        enableShimmer={!aggregatedBundle}
        shimmerLines={5}
        detailsListStyles={tableHeaderStyles}
      />
      {!loadMore && aggregatedBundle && aggregatedBundle.length > 5 && <LoadMore onClick={handleLoadMore} />}
    </ChartPartWrap>
  )
}
