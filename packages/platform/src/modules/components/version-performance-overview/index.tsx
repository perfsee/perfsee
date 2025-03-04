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

import { Spinner, SpinnerSize, Stack } from '@fluentui/react'
import { FC, useMemo } from 'react'

import { Empty } from '@perfsee/components'
import { SnapshotStatus } from '@perfsee/schema'
import { addSize, getDefaultSize } from '@perfsee/shared'

import { useProject } from '../../shared'
import { VersionSnapshotReport, Artifact, VersionLHContent } from '../../version-report/types'

import { LoadingSpan, LoadingWrap, VersionDetailWrap } from './styled'
import { ArtifactScore, BaseInfo, LhOtherScore, PerformanceRadarChart, PerformanceScore } from './widgets'
import { PerformanceRadarWrap } from './widgets/styled'
import { getSnapshotReportURL } from './widgets/utils'

type Props = {
  hash?: string
  snapshotReport?: VersionSnapshotReport
  entrypoint?: string
  artifact?: Artifact | null
  lhContent: VersionLHContent
  loading: boolean
  hideBasic?: boolean
  sourceIssueCount: number
}

export const VersionPerformanceOverview: FC<Props> = ({
  hideBasic,
  hash,
  snapshotReport,
  artifact,
  entrypoint,
  lhContent,
  loading,
  sourceIssueCount,
}) => {
  const project = useProject()

  const { scores, metricScores } = useMemo(() => {
    if (!lhContent) {
      return {}
    }

    const { metricScores, categories } = lhContent
    const scores = categories ?? {}

    return { scores, metricScores }
  }, [lhContent])

  if (loading) {
    return (
      <LoadingWrap>
        <Spinner size={SpinnerSize.large} />
        <LoadingSpan>Fetching data...</LoadingSpan>
      </LoadingWrap>
    )
  }

  if (!hash || !project) {
    return <Empty withIcon={true} styles={{ root: { margin: '10px' } }} title="No report" />
  }

  if (snapshotReport && snapshotReport.status !== SnapshotStatus.Completed) {
    return (
      <Stack horizontalAlign="center">
        <p>The report is {snapshotReport.status}</p>
        <b>{snapshotReport.failedReason}</b>
      </Stack>
    )
  }

  const entry = artifact?.entrypoints?.find((e) => e.entrypoint === entrypoint)

  return (
    <>
      {hideBasic ? undefined : snapshotReport ? (
        <BaseInfo
          reportId={snapshotReport.id}
          hash={hash}
          snapshotCreatedAt={snapshotReport.createdAt}
          artifact={artifact}
        />
      ) : null}
      <VersionDetailWrap>
        <div>
          {snapshotReport ? (
            <PerformanceScore
              reportLink={getSnapshotReportURL(project.id, snapshotReport)}
              performanceScore={snapshotReport.performanceScore}
              status={snapshotReport.status}
              sourceIssueCount={sourceIssueCount}
              hash={hash}
              reportId={snapshotReport.id}
            />
          ) : null}
          {snapshotReport ? <LhOtherScore project={project} report={snapshotReport} scores={scores} /> : null}
          {artifact ? (
            <ArtifactScore
              bundleId={artifact.id}
              score={entry?.score || null}
              size={artifact.entrypoints?.reduce((total, { size }) => addSize(total, size), getDefaultSize())}
              entryInitialSize={entry?.initialSize}
              entrySize={entry?.size}
            />
          ) : (
            <div style={{ marginTop: 24 }}>
              <Empty title="No artifact found with this commit" />
            </div>
          )}
        </div>
        {snapshotReport ? (
          <PerformanceRadarChart metricsScores={metricScores ?? []} />
        ) : (
          <PerformanceRadarWrap>
            <Empty withIcon title="No snapshot report found with this commit" />
          </PerformanceRadarWrap>
        )}
      </VersionDetailWrap>
    </>
  )
}
