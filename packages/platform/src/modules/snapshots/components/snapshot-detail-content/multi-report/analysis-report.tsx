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
import { FC, useCallback, useMemo, useState } from 'react'

import { ForeignLink, MultiSelector, useWideScreen } from '@perfsee/components'
import { AnalysisReportContent } from '@perfsee/lab-report'
import { LabQueryStringContext } from '@perfsee/lab-report/context'
import { PerformanceTabType, SnapshotDetailType, SnapshotReportSchema } from '@perfsee/lab-report/snapshot-type'
import { useProject } from '@perfsee/platform/modules/shared'
import { pathFactory } from '@perfsee/shared/routes'

import { HeaderTitle } from './style'

type Props = {
  snapshots: SnapshotDetailType[]
}

export const MultiContentReport: FC<Props> = ({ snapshots }) => {
  useWideScreen()

  const [reportIds, setReportIds] = useState(() => snapshots.map((snapshot) => snapshot.report.id))
  const reportSelectOptios = useMemo(() => {
    return snapshots.map((snapshot) => {
      const report = snapshot.report as NonNullable<SnapshotReportSchema>
      const title = report.snapshot.title ?? `Snapshot #${report.snapshot.id}`
      return {
        id: report.id,
        name: `${report.page.name} - ${title}`,
      }
    })
  }, [snapshots])
  const onSelectChange = useCallback((ids: number[]) => {
    setReportIds(ids)
  }, [])

  const project = useProject()

  const reports = useMemo(() => {
    return snapshots
      .filter((s) => reportIds.includes(s.report.id))
      .map((snapshot, i) => {
        const report = snapshot.report as NonNullable<SnapshotReportSchema>
        const title = report.snapshot.title ?? `Snapshot #${report.snapshot.id}`
        const link = project
          ? pathFactory.project.lab.report({
              projectId: project.id,
              reportId: report.id,
              tabName: PerformanceTabType.Overview,
            })
          : undefined
        return (
          <div key={report.id} style={{ minWidth: '768px' }}>
            <ForeignLink href={link}>
              {i + 1}.{report.page.name} - {title}
            </ForeignLink>
            <AnalysisReportContent snapshot={snapshot} disableAutoScroll />
          </div>
        )
      })
  }, [project, reportIds, snapshots])

  const [query, setQuery] = useState<Record<string, string>>({})
  const updateQuery = useCallback((patch: Record<string, string>, replace?: boolean | undefined) => {
    if (replace) {
      setQuery(patch)
    } else {
      setQuery((old) => ({
        ...(old || {}),
        ...patch,
      }))
    }
  }, [])

  return (
    <Stack tokens={{ childrenGap: 10, padding: '8px' }} styles={{ root: { overflowX: 'auto' } }}>
      <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 12 }}>
        <HeaderTitle>Selected Reports</HeaderTitle>
        <MultiSelector options={reportSelectOptios} ids={reportIds} onSelectChange={onSelectChange} maxWidth={500} />
      </Stack>
      <Stack horizontal tokens={{ childrenGap: 48 }}>
        <LabQueryStringContext.Provider value={[query, updateQuery]}>{reports}</LabQueryStringContext.Provider>
      </Stack>
    </Stack>
  )
}
