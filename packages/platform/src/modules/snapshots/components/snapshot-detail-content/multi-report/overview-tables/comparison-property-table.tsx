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

import { SelectionMode, TooltipHost } from '@fluentui/react'
import dayJs from 'dayjs'
import { isNumber } from 'lodash'
import { FC, useMemo } from 'react'
import { Link } from 'react-router-dom'

import { HeaderWithVerticalLineStyles, onRenderVerticalLineRow, Table, TableColumnProps } from '@perfsee/components'
import { useProject } from '@perfsee/platform/modules/shared'
import { LighthouseScoreMetric } from '@perfsee/shared'
import { pathFactory } from '@perfsee/shared/routes'

import { PerformanceTabType, SnapshotDetailType, SnapshotReportSchema } from '../../../../snapshot-type'
import { HeaderTitle } from '../style'

type Props = {
  snapshots: SnapshotDetailType[]
}

type ItemSchema = {
  index: number
  name: string
  link: string
  title: string
  envName: string
  profileName: string
  createdAt: string
  snapshotId: number
  performance: number | string
  seo: number | string
  a11y: number | string
  bp: number | string
  pwa: number | string
}

const columns: TableColumnProps<ItemSchema>[] = [
  {
    key: 'index',
    name: '#',
    fieldName: 'index',
    minWidth: 10,
    maxWidth: 20,
  },
  {
    key: 'name',
    name: 'Page',
    minWidth: 120,
    maxWidth: 200,
    onRender: (item) => (
      <b>
        <TooltipHost content="Go to the lab snapshot report.">
          <Link to={item.link}>{item.name}</Link>
        </TooltipHost>
      </b>
    ),
  },
  {
    key: 'title',
    name: 'Snapshot',
    fieldName: 'title',
    minWidth: 100,
    maxWidth: 160,
  },
  {
    key: 'profileName',
    name: 'Profile',
    fieldName: 'profileName',
    minWidth: 90,
    maxWidth: 110,
  },
  {
    key: 'envName',
    name: 'Environment',
    fieldName: 'envName',
    minWidth: 100,
    maxWidth: 110,
  },
  {
    key: 'createdAt',
    name: 'Created At',
    fieldName: 'createdAt',
    minWidth: 120,
    maxWidth: 140,
  },
  {
    key: 'performance',
    name: 'Performance',
    fieldName: 'performance',
    minWidth: 100,
    maxWidth: 100,
    comparator: (a, b) => (isNumber(a.performance) && isNumber(b.performance) ? b.performance - a.performance : 0),
  },
  {
    key: 'seo',
    name: 'SEO',
    fieldName: 'seo',
    minWidth: 80,
    maxWidth: 90,
    comparator: (a, b) => (isNumber(a.seo) && isNumber(b.seo) ? b.seo - a.seo : 0),
  },
  {
    key: 'a11y',
    name: 'A11y',
    fieldName: 'a11y',
    minWidth: 80,
    maxWidth: 90,
    comparator: (a, b) => (isNumber(a.a11y) && isNumber(b.a11y) ? b.a11y - a.a11y : 0),
  },
  {
    key: 'bp',
    name: 'BestPractice',
    fieldName: 'bp',
    minWidth: 100,
    maxWidth: 110,
    comparator: (a, b) => (isNumber(a.bp) && isNumber(b.bp) ? b.bp - a.bp : 0),
  },
  {
    key: 'pwa',
    name: 'PWA',
    fieldName: 'pwa',
    minWidth: 90,
    maxWidth: 100,
    comparator: (a, b) => (isNumber(a.pwa) && isNumber(b.pwa) ? b.pwa - a.pwa : 0),
  },
]

export const ComparisonPropertyTable: FC<Props> = ({ snapshots }) => {
  const project = useProject()

  const items = useMemo(() => {
    if (!project) {
      return []
    }

    return snapshots.map((snapshot, i) => {
      const report = snapshot.report as NonNullable<SnapshotReportSchema>
      const link = pathFactory.project.lab.report({
        projectId: project.id,
        reportId: report.id,
        tabName: PerformanceTabType.Overview,
      })

      const performance = snapshot.categories?.[LighthouseScoreMetric.Performance]?.score
      const seo = snapshot.categories?.[LighthouseScoreMetric.SEO]?.score
      const a11y = snapshot.categories?.[LighthouseScoreMetric.Accessibility]?.score
      const bp = snapshot.categories?.[LighthouseScoreMetric.BestPractices]?.score
      const pwa = snapshot.categories?.[LighthouseScoreMetric.PWA]?.score

      return {
        index: i + 1,
        name: report.page.name,
        title: report.snapshot.title ?? `Snapshot #${report.snapshot.id}`,
        envName: report.environment.name,
        profileName: report.profile.name,
        link,
        createdAt: dayJs(report.createdAt).calendar(),
        snapshotId: report.snapshot.id,
        performance: performance ? Math.round(performance * 100) : '-',
        seo: seo ? Math.round(seo * 100) : '-',
        a11y: a11y ? Math.round(a11y * 100) : '-',
        bp: bp ? Math.round(bp * 100) : '-',
        pwa: pwa ? Math.round(pwa * 100) : '-',
      }
    })
  }, [project, snapshots])

  return (
    <>
      <HeaderTitle>Comparison Page List</HeaderTitle>
      <Table
        items={items}
        detailsListStyles={HeaderWithVerticalLineStyles}
        selectionMode={SelectionMode.none}
        columns={columns}
        onRenderRow={onRenderVerticalLineRow}
      />
    </>
  )
}
