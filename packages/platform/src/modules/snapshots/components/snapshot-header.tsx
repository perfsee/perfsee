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

import { ClockCircleOutlined, PlusOutlined, SelectOutlined } from '@ant-design/icons'
import { Stack, TooltipHost } from '@fluentui/react'
import { useModule, useModuleState } from '@sigi/react'
import dayjs from 'dayjs'
import { uniqBy } from 'lodash'
import { memo, useCallback, useMemo } from 'react'
import { useHistory, useParams } from 'react-router'

import { ForeignLink, Select } from '@perfsee/components'
import { pathFactory } from '@perfsee/shared/routes'

import { LabListModule, ReportsPayload } from '../../lab/list/module'
import { CompareModule, useProject } from '../../shared'
import { PerformanceTabType, SnapshotReportSchema } from '../snapshot-type'
import { SnapshotModule } from '../snapshot.module'
import { SnapshotKey, SnapshotHeaderTime, OperationButton } from '../style'

type Props = {
  report: SnapshotReportSchema
  snapshotTitle: string
}

export const SnapshotHeader = memo(function SnapshotHeader(props: Props) {
  const { report, snapshotTitle } = props
  const [reports, dispatcher] = useModule(LabListModule, {
    selector: (s) => (s.reportsWithId[report.snapshot.id] as ReportsPayload<false>)?.reports ?? [],
    dependencies: [],
  })

  const detail = useModuleState(SnapshotModule, {
    selector: (s) => s.snapshotReportsDetail[report.reportLink!],
    dependencies: [],
  })

  const history = useHistory()
  const project = useProject()
  const routerParams = useParams<{ tabName: string }>()

  const onSelectorChange = useCallback(
    (type: 'page' | 'profile' | 'environment') => (id: number) => {
      let payload
      if (type === 'page') {
        let list = reports.filter((r) => r.page.id === id)
        list = list.length > 1 ? list.filter((r) => r.profile.id === report.profile.id) : list
        list = list.length > 1 ? list.filter((r) => r.environment.id === report.environment.id) : list
        payload = list[0]
      }

      if (type === 'profile') {
        let list = reports.filter((r) => r.profile.id === id)
        list = list.length > 1 ? list.filter((r) => r.page.id === report.page.id) : list
        list = list.length > 1 ? list.filter((r) => r.environment.id === report.environment.id) : list
        payload = list[0]
      }

      if (type === 'environment') {
        let list = reports.filter((r) => r.environment.id === id)
        list = list.length > 1 ? list.filter((r) => r.page.id === report.page.id) : list
        list = list.length > 1 ? list.filter((r) => r.profile.id === report.profile.id) : list
        payload = list[0]
      }

      if (!payload) {
        return
      }

      const differentType = report.page.isE2e !== payload.page.isE2e

      history.push(
        pathFactory.project.lab.report({
          projectId: project!.id,
          reportId: payload.id,
          tabName: differentType ? PerformanceTabType.Overview : routerParams.tabName,
        }),
      )
    },
    [history, project, routerParams, reports, report.profile.id, report.environment.id, report.page],
  )

  const fetchReports = useCallback(() => {
    if (!reports.length) {
      dispatcher.getSnapshotReports(report.snapshot.id)
    }
  }, [dispatcher, report.snapshot.id, reports])

  const [pageOptions, profileOptions, envOptions] = useMemo(() => {
    if (!reports.length) {
      return [
        [{ key: report.page.id, text: report.page.name }],
        [{ key: report.profile.id, text: report.profile.name }],
        [{ key: report.environment.id, text: report.environment.name }],
      ]
    }
    const pages: { key: number; text: string }[] = []
    const profiles: { key: number; text: string }[] = []
    const envs: { key: number; text: string }[] = []

    reports.forEach((r) => {
      pages.push({ key: r.page.id, text: r.page.name })
      profiles.push({ key: r.profile.id, text: r.profile.name })
      envs.push({ key: r.environment.id, text: r.environment.name })
    })

    return [uniqBy(pages, 'key'), uniqBy(profiles, 'key'), uniqBy(envs, 'key')]
  }, [report, reports])

  if (!report) {
    return null
  }

  return (
    <div style={{ width: '100%' }}>
      <Stack
        styles={{ root: { marginBottom: '16px' } }}
        horizontal
        verticalAlign="center"
        horizontalAlign="space-between"
      >
        <div>
          <SnapshotKey>{snapshotTitle}</SnapshotKey>
          <SnapshotHeaderTime>
            <ClockCircleOutlined />
            {dayjs(report.createdAt).format('MMM D, YYYY h:mm A')}
            {detail?.lighthouseVersion ? ` · Lighthouse v${detail.lighthouseVersion}` : undefined}
          </SnapshotHeaderTime>
        </div>
      </Stack>
      <Stack styles={{ root: { marginBottom: '16px' } }} horizontal horizontalAlign="space-between">
        <Stack horizontal tokens={{ childrenGap: 12 }}>
          <Select
            onClick={fetchReports}
            title="Page"
            selectedKey={report.page.id}
            options={pageOptions}
            onKeyChange={onSelectorChange('page')}
          />
          <Select
            onClick={fetchReports}
            title="Profile"
            selectedKey={report.profile.id}
            options={profileOptions}
            onKeyChange={onSelectorChange('profile')}
          />
          <Select
            onClick={fetchReports}
            title="Env"
            selectedKey={report.environment.id}
            options={envOptions}
            onKeyChange={onSelectorChange('environment')}
          />
        </Stack>
        <Operator report={report} />
      </Stack>
    </div>
  )
})

const Operator = ({ report }: { report: SnapshotReportSchema }) => {
  const [{ compareReports }, dispatcher] = useModule(CompareModule)
  const project = useProject()
  const { page } = report

  const addReport = useCallback(() => {
    if (!report || !project) {
      return
    }

    dispatcher.addReport({
      projectId: project.id,
      reportId: report.id,
      data: {
        name: page.name,
        snapshotId: report.snapshot.id,
      },
    })
  }, [dispatcher, page.name, project, report])

  const pageUrl = report.host ? page.url.replace(new URL(page.url).host, report.host) : page.url

  return (
    <Stack horizontal tokens={{ childrenGap: 8 }}>
      {!page.isE2e && !compareReports[project!.id]?.[report.id] ? (
        <OperationButton onClick={addReport}>
          <TooltipHost content="Add this report to compare.">
            <PlusOutlined /> Add to compare
          </TooltipHost>
        </OperationButton>
      ) : null}
      <OperationButton>
        <ForeignLink href={pageUrl}>
          View tested page <SelectOutlined />
        </ForeignLink>
      </OperationButton>
    </Stack>
  )
}
