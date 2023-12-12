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
import { CommandButton, IPivotItemProps, PivotItem } from '@fluentui/react'
import { FC, memo, useCallback, useEffect, useState } from 'react'

import { AuditItem, formatMDLink, useQueryString } from '@perfsee/components'
import { LabAuditDetailWithPanel } from '@perfsee/platform/modules/components'

import {
  LighthouseAudit,
  LighthouseGroupType,
  SnapshotDetailType,
  SnapshotUserFlowDetailType,
  AnalysisReportTabType,
} from '../../../snapshot-type'
import { ScoreBadge } from '../../../style'

import { AuditJump, auditJumps } from './jumps'
import { AuditTitle, StyledPivot, RelevantChoiceContainer, RelevantChoiceButton } from './style'
import { getGroupedAuditLists } from './utils'

type Props = {
  type: AnalysisReportTabType
  snapshot: SnapshotDetailType | SnapshotUserFlowDetailType
  hideBorder?: boolean
}

interface RelevantsChoiceProps {
  relevant: { key?: string; text: string }
  selected: boolean
  onChange: (selected?: string) => void
}

const defaultChoiceOption = { key: undefined, text: 'ALL' }

const RelevantsChoice: FC<RelevantsChoiceProps> = ({ selected, onChange, relevant: r }) => {
  const onClick = useCallback(() => {
    onChange(r.key)
  }, [onChange, r])

  return (
    <RelevantChoiceButton key={r.key} onClick={onClick} className={selected ? 'selected' : undefined}>
      {r.text}
    </RelevantChoiceButton>
  )
}

export const PerformanceContent = memo((props: Props) => {
  const { type, snapshot, hideBorder } = props
  const { audits, categories } = snapshot
  const theme = useTheme()

  const [{ relevant }, updateQueryString] = useQueryString<{ relevant?: string }>()
  const onRelevantChange = useCallback(
    (selected?: string) => {
      updateQueryString({ relevant: selected })
    },
    [updateQueryString],
  )

  useEffect(() => {
    updateQueryString({ relevant: undefined })
    // eslint-disable-next-line
  }, [type])

  const performance = categories?.[type]
  if (!performance) {
    return null
  }

  const { result, relevantAuditMap } = getGroupedAuditLists(audits, performance.auditRefs)
  const options = [...relevantAuditMap.keys()].map((r) => ({ key: r, text: r }))
  const relevantFilter = options.length ? (
    <RelevantChoiceContainer horizontal horizontalAlign="end" verticalAlign="center">
      <label>Show audits relevant to: </label>
      <RelevantsChoice relevant={defaultChoiceOption} selected={relevant === undefined} onChange={onRelevantChange} />
      {options.map((r) => (
        <RelevantsChoice relevant={r} selected={relevant === r.key} onChange={onRelevantChange} key={r.key} />
      ))}
    </RelevantChoiceContainer>
  ) : null

  return (
    <div
      css={
        hideBorder
          ? undefined
          : css({
              borderLeft: `1px solid ${theme.border.color}`,
              borderRight: `1px solid ${theme.border.color}`,
              position: 'relative',
            })
      }
      className="lh-vars"
    >
      {relevantFilter}
      {Object.keys(result).map((type) => {
        const list: LighthouseAudit[] = result[type]
        return (
          <AdviceList
            key={type}
            list={relevant ? list.filter((a) => a.relevant?.includes(relevant)) : list}
            type={type as LighthouseGroupType}
            entities={snapshot.entities}
            fullPageScreenshot={snapshot.fullPageScreenshot}
          />
        )
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
    case LighthouseGroupType.diagnostic:
      return [<InfoCircleFilled key={type} style={{ color: theme.colors.disabled }} />, 'Diagnostics']
  }
}

export const AdviceList = (props: {
  list: LighthouseAudit[]
  type: LighthouseGroupType
  entities?: LH.Result.Entities
  fullPageScreenshot?: LH.Result.FullPageScreenshot
}) => {
  const { list, type, entities, fullPageScreenshot } = props
  const [icon, title] = RenderIconAndTitle(type) as [JSX.Element, string]
  const [show, setShow] = useState(![LighthouseGroupType.passed, LighthouseGroupType.notApply].includes(type))

  const onShowClick = useCallback(() => {
    setShow((show) => !show)
  }, [])
  const showButton = <CommandButton onClick={onShowClick}>{show ? 'Hide' : 'Show'}</CommandButton>

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

    const auditJump = auditJumps[item.id] ? <AuditJump {...auditJumps[item.id]} /> : null

    return (
      <AuditItem
        key={item.id}
        title={item.title}
        icon={icon}
        labels={labels.filter(Boolean) as string[]}
        extra={auditJump}
      >
        {formatMDLink(item.description)}
        <LabAuditDetailWithPanel details={item.details} entities={entities} fullPageScreenshot={fullPageScreenshot} />
      </AuditItem>
    )
  })

  return (
    <>
      <AuditTitle>
        {title} &#8231; {items.length}
        {showButton}
      </AuditTitle>
      {show ? items : null}
    </>
  )
}

export const AnalysisReportContent = ({ snapshot }: Pick<Props, 'snapshot'>) => {
  const categories = snapshot.categories ?? ({} as Record<string, LH.Result.Category>)
  const [{ category = AnalysisReportTabType.Performance }, updateQueryString] = useQueryString<{
    category?: AnalysisReportTabType
  }>()

  const onLinkClick = useCallback(
    (item?: PivotItem) => {
      if (item?.props.itemKey) {
        updateQueryString({ category: item.props.itemKey as AnalysisReportTabType })
      }
    },
    [updateQueryString],
  )

  return (
    <div>
      <StyledPivot selectedKey={category} onLinkClick={onLinkClick}>
        {Object.values(categories).map((tab) => {
          return (
            <PivotItem itemKey={tab.id} key={tab.id} onRenderItemLink={RenderLHTitle(tab)} headerText={tab.title} />
          )
        })}
      </StyledPivot>
      <PerformanceContent type={category} snapshot={snapshot} />
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
