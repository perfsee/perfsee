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

import { IPivotItemProps, Pivot, PivotItem, Spinner } from '@fluentui/react'
import { useModuleState } from '@sigi/react'
import { useCallback, useMemo } from 'react'

import { Empty, useQueryString } from '@perfsee/components'
import { LighthouseScoreMetric } from '@perfsee/shared'

import { getGroupedAuditLists } from '../../snapshots/components/snapshot-detail-content/pivot-content-performance/utils'
import { LighthouseAudit, LighthouseGroupType } from '../../snapshots/snapshot-type'
import { EntryPointSchema } from '../types'
import { HashReportModule } from '../version-report.module'

import { LabAudits, LongTaskAuditProps, NoAudit } from './audits'
import { SecondPivotStyle } from './styled'

const RenderPivotItem = (tab: { title: string; count?: number | null }) => (props?: IPivotItemProps) => {
  if (!props) {
    return null
  }
  if (typeof tab.count !== 'number') {
    return <span>{props.headerText}</span>
  }

  return (
    <span>
      {props.headerText} · {tab.count}
    </span>
  )
}

interface Props {
  entrypoint?: EntryPointSchema
}

export const Solution = ({ entrypoint }: Props) => {
  const { lhContent, issues } = useModuleState(HashReportModule)
  const [{ reportId, solution: tabName = 'bundle' }, updateQueryString] = useQueryString<{
    reportId: number
    version: string
    solution: string
  }>()

  const onLinkClick = useCallback(
    (item?: PivotItem) => {
      if (item?.props.itemKey) {
        updateQueryString({ solution: item.props.itemKey })
      }
    },
    [updateQueryString],
  )

  const otherPivots = useMemo(() => {
    if (!lhContent.categories) {
      return null
    }

    return Object.values(lhContent.categories!).map((tab) => {
      const auditRefs = lhContent.categories?.[tab.id]?.auditRefs
      let labAudits: LighthouseAudit[] = []
      let count: number | undefined

      if (lhContent.audits && auditRefs) {
        const opportunities = getGroupedAuditLists(lhContent.audits, auditRefs, true)[LighthouseGroupType.opportunity]
        count = opportunities.length
        labAudits = opportunities
      }

      const issue = reportId && tab.id === LighthouseScoreMetric.Performance ? issues[reportId] : undefined

      return (
        <PivotItem
          onRenderItemLink={RenderPivotItem({ title: tab.title, count: issue && count ? count + 1 : count })}
          itemKey={tab.id}
          key={tab.id}
          headerText={tab.title}
        >
          <PerformanceContent labAudits={labAudits} issue={issue} />
        </PivotItem>
      )
    })
  }, [issues, lhContent.audits, lhContent.categories, reportId])

  if (lhContent.loading) {
    return <Spinner />
  }

  if (!entrypoint && !lhContent.audits) {
    return <Empty withIcon={true} styles={{ root: { margin: '10px' } }} title="Nothing here!" />
  }

  return (
    <>
      <Pivot styles={SecondPivotStyle} linkFormat="tabs" selectedKey={tabName} onLinkClick={onLinkClick}>
        {/* disable bundle solution here */}
        {/* need a new design for version report */}
        {/* <PivotItem
          onRenderItemLink={RenderPivotItem({ title: 'Bundle', count: bundleAudits.length })}
          itemKey={'bundle'}
          key={'bundle'}
          headerText="Bundle"
        >
          <BundleContent bundleAudits={bundleAudits} />
        </PivotItem> */}
        {otherPivots}
      </Pivot>
    </>
  )
}

interface PerformanceProps extends LongTaskAuditProps {
  labAudits: LighthouseAudit[]
}

const PerformanceContent = (props: PerformanceProps) => {
  const { labAudits, issue } = props

  if (!labAudits.length) {
    return <NoAudit />
  }

  return <LabAudits audits={labAudits} issue={issue} />
}
