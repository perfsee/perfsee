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

import { CheckCircleFilled, CloseCircleFilled, MinusCircleFilled, InfoCircleFilled } from '@ant-design/icons'
import { css, useTheme } from '@emotion/react'
import { IPivotItemProps, PivotItem } from '@fluentui/react'
import { memo, useCallback, useState } from 'react'

import { AuditItem, formatMDLink } from '@perfsee/components'
import { LabAuditDetailWithPanel } from '@perfsee/platform/modules/components'

import {
  LighthouseAudit,
  LighthouseGroupType,
  SnapshotDetailType,
  SnapshotUserFlowDetailType,
  AnalysisReportTabType,
} from '../../../snapshot-type'
import { ScoreBadge } from '../../../style'

import { AuditTitle, StyledPivot } from './style'
import { getGroupedAuditLists } from './utils'

type Props = {
  type: AnalysisReportTabType
  snapshot: SnapshotDetailType | SnapshotUserFlowDetailType
  hideBorder?: boolean
}

export const PerformanceContent = memo((props: Props) => {
  const { type, snapshot, hideBorder } = props
  const { audits, categories } = snapshot
  const theme = useTheme()

  const performance = categories?.[type]
  if (!performance) {
    return null
  }

  const result = getGroupedAuditLists(audits, performance.auditRefs)

  return (
    <div
      css={
        hideBorder
          ? undefined
          : css({ borderLeft: `1px solid ${theme.border.color}`, borderRight: `1px solid ${theme.border.color}` })
      }
    >
      {Object.values(LighthouseGroupType).map((type) => {
        return <AdviceList key={type} list={result[type]} type={type} />
      })}
    </div>
  )
})

const RenderIconAndTitle = (type: LighthouseGroupType) => {
  const theme = useTheme()

  switch (type) {
    case LighthouseGroupType.opportunity:
      return [<CloseCircleFilled key={type} style={{ color: theme.colors.error }} />, 'Opportunities']
    case LighthouseGroupType.passed:
      return [<CheckCircleFilled key={type} style={{ color: theme.colors.success }} />, 'Passed audits']
    case LighthouseGroupType.notApply:
      return [<MinusCircleFilled key={type} style={{ color: theme.colors.disabled }} />, 'Not applicable']
    case LighthouseGroupType.manual:
      return [<InfoCircleFilled key={type} style={{ color: theme.colors.disabled }} />, 'Items to manually check']
  }
}

export const AdviceList = (props: { list: LighthouseAudit[]; type: LighthouseGroupType }) => {
  const { list, type } = props
  const [icon, title] = RenderIconAndTitle(type) as [JSX.Element, string]

  if (!list.length) {
    return null
  }

  const items = list.map((item) => {
    const labels = item?.relevant
      ? [...item.relevant, item.displayValue, item.explanation]
      : [item.displayValue, item.explanation]

    if (item.scoreDisplayMode === 'numeric' && item.score) {
      labels.unshift(`Score: ${(item.score * 100).toFixed(0)}`)
    }

    return (
      <AuditItem key={item.id} title={item.title} icon={icon} labels={labels.filter(Boolean) as string[]}>
        {formatMDLink(item.description)}
        <LabAuditDetailWithPanel details={item.details} />
      </AuditItem>
    )
  })

  return (
    <>
      <AuditTitle>
        {title}
        &#8231;{items.length}
      </AuditTitle>
      {items}
    </>
  )
}

export const AnalysisReportContent = ({ snapshot }: Pick<Props, 'snapshot'>) => {
  const categories = snapshot.categories ?? {}
  const [tabName, setTabName] = useState<AnalysisReportTabType>(AnalysisReportTabType.Performance)

  const onLinkClick = useCallback((item?: PivotItem) => {
    if (item?.props.itemKey) {
      setTabName(item.props.itemKey as AnalysisReportTabType)
    }
  }, [])

  return (
    <div>
      <StyledPivot selectedKey={tabName} onLinkClick={onLinkClick}>
        {Object.values(categories).map((tab) => {
          return (
            <PivotItem itemKey={tab.id} key={tab.id} onRenderItemLink={RenderLHTitle(tab)} headerText={tab.title} />
          )
        })}
      </StyledPivot>
      <PerformanceContent type={tabName} snapshot={snapshot} />
    </div>
  )
}

const RenderLHTitle = (tab: { title: string; score: number | null }) => (props?: IPivotItemProps) => {
  if (!props) {
    return null
  }

  if (tab.score == null) {
    return <span>{props.headerText}</span>
  }

  const score = Math.round(tab.score * 100)

  return (
    <span>
      {props.headerText}
      <ScoreBadge score={score}>{score}</ScoreBadge>
    </span>
  )
}
