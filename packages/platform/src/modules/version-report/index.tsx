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

import { LeftOutlined } from '@ant-design/icons'
import { NeutralColors, Pivot, PivotItem, Stack } from '@fluentui/react'
import { useModule } from '@sigi/react'
import { capitalize } from 'lodash'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useHistory } from 'react-router'

import { useQueryString, ContentCard } from '@perfsee/components'
import { SnapshotStatus } from '@perfsee/schema'
import { pathFactory } from '@perfsee/shared/routes'

import { Breadcrumb, VersionPerformanceOverview } from '../components'
import { useBreadcrumb, useGenerateProjectRoute } from '../shared'

import { EntryPointSchema, VersionSnapshotReport } from './types'
import { HashReportModule } from './version-report.module'
import { BaseInfo, Solution, CommitSelector } from './widgets'

enum PivotKey {
  Overview = 'overview',
  Solution = 'solution',
}

export const VersionReport = () => {
  const generateProjectRoute = useGenerateProjectRoute()
  const history = useHistory()
  const breadcrumb = useBreadcrumb({ versionReportPage: true })

  const [{ allCommits, versionInfo, artifactJob, lab, lhContent, currentIssueCount }, dispatcher] =
    useModule(HashReportModule)
  const [{ hash = '', reportId, tabName = PivotKey.Overview }, updateQueryString] = useQueryString<{
    hash: string
    reportId: number
    tabName: string
  }>()

  const [selectedReport, setReport] = useState<VersionSnapshotReport | undefined>()
  const [entrypoint, setEntryPoint] = useState<EntryPointSchema | undefined>()

  const onChangeCommit = useCallback(
    (v: string) => {
      if (v !== hash) {
        dispatcher.resetData()
        updateQueryString({
          hash: v,
          reportId: undefined,
        })
        setReport(undefined)
      }
    },
    [dispatcher, updateQueryString, hash],
  )

  const backToHome = useCallback(() => {
    history.push(generateProjectRoute(pathFactory.project.home, {}))
  }, [generateProjectRoute, history])

  const reports = useMemo(() => {
    return lab.reports?.filter((r) => r.status === SnapshotStatus.Completed) ?? []
  }, [lab.reports])

  const onReportChange = useCallback(
    (id: number) => {
      updateQueryString({
        reportId: id,
      })
      setReport(reports.find((r) => r.id === id))
    },
    [reports, updateQueryString],
  )

  useEffect(() => {
    dispatcher.getRecentCommits()
    return () => {
      dispatcher.dispose()
    }
  }, [dispatcher])

  useEffect(() => {
    if (hash && allCommits.commits.length) {
      dispatcher.getArtifactByCommit(hash)
      dispatcher.getVersionInfo({ hash })
      dispatcher.getSnapshotByCommit({ hash })
      dispatcher.fetchSourceIssueCount({ hash })
    }
  }, [allCommits, dispatcher, hash])

  useEffect(() => {
    if (allCommits.commits.length && (!hash || !allCommits.commits.includes(hash))) {
      updateQueryString({
        hash: allCommits.commits[0],
      })
    }
  }, [allCommits, updateQueryString, hash])

  useEffect(() => {
    // init snapshot report
    if (!selectedReport && reports.length) {
      if (reportId) {
        setReport(reports.find((r) => r.id === reportId))
      } else {
        updateQueryString({ reportId: reports[0].id })
        setReport(reports[0])
      }
    }
  }, [reports, reportId, selectedReport, updateQueryString])

  useEffect(() => {
    // init source issue
    if (selectedReport) {
      dispatcher.getIssuesByReportId(selectedReport.id)
    }
  }, [dispatcher, selectedReport])

  const entryPoints = artifactJob.artifact?.entrypoints ?? []
  if (!entrypoint && entryPoints.length) {
    setEntryPoint(entryPoints[0])
  }

  const onLinkClick = useCallback(
    (item?: PivotItem) => {
      updateQueryString({ tabName: item?.props.itemKey ?? PivotKey.Overview })
    },
    [updateQueryString],
  )

  const onRenderHeader = useCallback(
    () => (
      <Stack verticalAlign="center" horizontal={true}>
        <LeftOutlined onClick={backToHome} style={{ color: NeutralColors.gray100, marginRight: '14px' }} />
        <b style={{ fontSize: '16px', marginRight: '20px' }}>Version Report</b>
        <CommitSelector commit={hash} allCommits={allCommits.commits} onChange={onChangeCommit} />
      </Stack>
    ),
    [allCommits, backToHome, onChangeCommit, hash],
  )

  useEffect(() => {
    if (selectedReport?.lighthouseStorageKey) {
      dispatcher.fetchLHContentFromTos(selectedReport.lighthouseStorageKey)
    }
  }, [dispatcher, selectedReport])

  return (
    <div style={{ minWidth: '1100px', padding: '0 20px' }}>
      <Breadcrumb items={breadcrumb} />
      <ContentCard onRenderHeader={onRenderHeader}>
        <BaseInfo
          artifact={artifactJob.artifact}
          versionInfo={versionInfo.appVersion}
          entry={entrypoint}
          entryPoints={entryPoints}
          hash={hash}
          report={selectedReport}
          reports={reports}
          onReportChange={onReportChange}
          onEntryChange={setEntryPoint}
        />
        <Pivot
          styles={{ root: { marginBottom: '16px', borderBottom: `1px solid ${NeutralColors.gray30}` } }}
          selectedKey={tabName}
          onLinkClick={onLinkClick}
        >
          <PivotItem itemKey={PivotKey.Overview} headerText={capitalize(PivotKey.Overview)}>
            <VersionPerformanceOverview
              hash={hash}
              snapshotReport={selectedReport}
              artifact={artifactJob.artifact}
              lhContent={lhContent}
              loading={allCommits.loading || lab.loading}
              hideBasic={true}
              sourceIssueCount={currentIssueCount}
            />
          </PivotItem>
          <PivotItem itemKey={PivotKey.Solution} headerText={capitalize(PivotKey.Solution)}>
            <Solution entrypoint={entrypoint} />
          </PivotItem>
        </Pivot>
      </ContentCard>
    </div>
  )
}
