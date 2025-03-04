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

import { Stack, IStackTokens } from '@fluentui/react'
import { useDispatchers, useModule } from '@sigi/react'
import { useEffect, useMemo, useState } from 'react'

import { SnapshotStatus } from '@perfsee/schema'

import { VersionReport } from '../../version-report'
import { VersionSnapshotReport } from '../../version-report/types'
import { HashReportModule } from '../../version-report/version-report.module'

import { StatisticsModule } from './module'
import { TrendsChart } from './trends-chart'

const stackTokens: IStackTokens = {
  childrenGap: 20,
}

export const Statistics = () => {
  const { reset } = useDispatchers(StatisticsModule)
  const [{ allCommits, lab }, dispatcher] = useModule(HashReportModule)

  const [selectedReport, setReport] = useState<VersionSnapshotReport | undefined>()

  const reports = useMemo(() => {
    return lab.reports?.filter((r) => r.status === SnapshotStatus.Completed) ?? []
  }, [lab.reports])

  useEffect(() => {
    dispatcher.getRecentCommits()
    return () => {
      reset()
      dispatcher.reset()
    }
  }, [dispatcher, reset])

  useEffect(() => {
    if (!selectedReport && reports.length) {
      setReport(reports[0])
    }
  }, [reports, selectedReport])

  useEffect(() => {
    if (selectedReport?.reportLink) {
      dispatcher.fetchReportDetail(selectedReport.reportLink)
    }
  }, [dispatcher, selectedReport])

  return (
    <Stack tokens={stackTokens}>
      <VersionReport hash={allCommits.commits[0]} />
      <TrendsChart />
    </Stack>
  )
}
