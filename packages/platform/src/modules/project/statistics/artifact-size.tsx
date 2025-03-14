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
import { IconButton, IIconProps, SelectionMode, Stack, TooltipHost } from '@fluentui/react'
import { useModule } from '@sigi/react'
import { get, groupBy } from 'lodash'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { useHistory } from 'react-router'
import { Link } from 'react-router-dom'

import { ForeignLink, getScoreColor, Table, TableColumnProps } from '@perfsee/components'
import { PrettyBytes } from '@perfsee/platform/common'
import { useProject } from '@perfsee/platform/modules/shared'
import { pathFactory, staticPath } from '@perfsee/shared/routes'

import { ArtifactNameSelector, BranchSelector } from '../../components'
import { useProjectRouteGenerator } from '../../shared'

import { BarChart } from './components/barchart'
import { LoadMore } from './components/load-more'
import { BundleEntrypoint, StatisticsModule } from './module'
import { ArtifactLabel, ChartPartHeader, ChartPartWrap, tableHeaderStyles } from './style'

type BundleAggregation = {
  entrypoint: React.ReactNode
  data: BundleEntrypoint[]
  entryName: string
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
  propertyName: string
  valueFormatter?: (value: number) => string
  getColor?: (value: number) => string
  maxValue?: number
}>(({ history, title, propertyName, valueFormatter, getColor, maxValue }) => {
  const generateProjectRoute = useProjectRouteGenerator()

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
      items={history
        .slice(-15)
        .filter((a) => !!a.artifactId)
        .map((artifact) => {
          const value = get(artifact, propertyName)
          return {
            type: value ? 'success' : 'missing',
            value,
            id: artifact.artifactId!,
            date: artifact.createdAt,
          }
        })}
      minLength={BARCHART_LENGTH}
      onRenderId={onRenderArtifactId}
      valueFormatter={valueFormatter || formatSize}
      getColor={getColor}
      maxValue={maxValue}
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
    key: 'score',
    name: 'Score',
    minWidth: 250,
    maxWidth: 250,
    onRender: ({ data }) => {
      return (
        <ArtifactSizeHistoryBarChart
          title="Score"
          history={data}
          propertyName="score"
          getColor={getScoreColor}
          // eslint-disable-next-line
          valueFormatter={(s) => s.toString()}
        />
      )
    },
  },
  {
    key: 'total',
    name: 'Total Size',
    minWidth: 250,
    maxWidth: 250,
    onRender: ({ data }) => {
      return <ArtifactSizeHistoryBarChart title="Total Size" history={data} propertyName="size.raw" />
    },
  },
  {
    key: 'initial',
    name: 'Initial Size',
    minWidth: 250,
    maxWidth: 250,
    onRender: ({ data }) => {
      return <ArtifactSizeHistoryBarChart title="Initial Size" history={data} propertyName="initialSize.raw" />
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
  const generateProjectRoute = useProjectRouteGenerator()
  const [{ bundleHistory }, dispatcher] = useModule(StatisticsModule, {
    selector: (state) => ({ bundleHistory: state.bundleHistory }),
    dependencies: [],
  })
  const [branch, setBranch] = useState<string>()
  const [artifactName, setArtifactName] = useState<string>()
  const [branchFetched, setBranchFetched] = useState(false)

  useEffect(() => {
    if (branchFetched) {
      dispatcher.getAggregatedArtifacts({
        length: 15,
        from: null,
        to: null,
        branch: branch ?? null,
        name: artifactName ?? null,
      })
    } else {
      dispatcher.setArtifacts([])
    }
  }, [dispatcher, branch, artifactName, branchFetched])

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
          data: data.sort((a, b) => (a.artifactId && b.artifactId ? a.artifactId - b.artifactId : 0)),
          entryName: entrypoint,
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
        { branch, name: name ?? artifactName ?? null, entrypoint: item.entryName },
      )
      history.push(path)
    },
    [generateProjectRoute, branch, artifactName, history],
  )

  const handleLoadMore = useCallback(() => {
    setLoadMore(true)
  }, [])

  const onChangeBranch = useCallback((branch: string | undefined) => {
    setBranchFetched(true)
    setBranch(branch)
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
          <BranchSelector defaultBranch={branch} shouldAutoSelect onChange={onChangeBranch} />
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
      {!aggregatedBundle?.length ? (
        <Stack horizontalAlign="center">
          <ForeignLink href={staticPath.docs.home + '/bundle/get-started'}>
            See how to upload bundles <SelectOutlined />
          </ForeignLink>
        </Stack>
      ) : null}
      {!loadMore && aggregatedBundle && aggregatedBundle.length > 5 && <LoadMore onClick={handleLoadMore} />}
    </ChartPartWrap>
  )
}
