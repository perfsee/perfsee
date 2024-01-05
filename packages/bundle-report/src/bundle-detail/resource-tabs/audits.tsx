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

import { FallOutlined, RiseOutlined } from '@ant-design/icons'
import { useTheme } from '@emotion/react'
import styled from '@emotion/styled'
import { CommandButton, SelectionMode } from '@fluentui/react'
import { partition } from 'lodash'
import { FC, useCallback, useMemo, useState } from 'react'

import {
  CollapsiblePanel,
  TooltipWithEllipsis,
  Table,
  ForeignLink,
  AuditItem as AuditItemBase,
} from '@perfsee/components'
import { BundleAuditResult, BundleAuditDetail, BundleAuditScore } from '@perfsee/shared'

import { ByteSizeWithDiff } from '../components'

import { useAuditScore } from './use-audit-score'

type Unwrap<T> = T extends Array<infer S> ? S : unknown

const AuditTitle = styled.h3({
  padding: '16px 0 0 8px',
  display: 'flex',
  alignItems: 'self-start',

  '& > button': {
    height: '26px',
    color: '#106ebe',
    marginLeft: 12,
  },
})

export function AuditItemDetail({ detail }: { detail: BundleAuditDetail }) {
  const columns = useMemo(() => {
    if (detail.type === 'list') {
      return [
        {
          key: 'item',
          name: 'Item',
          minWidth: 500,
          onRender: (item: any) => <TooltipWithEllipsis content={item} />,
        },
      ]
    }

    if (detail.type === 'table') {
      return detail.headings.map((head) => {
        return {
          key: head.key,
          name: head.name,
          minWidth: 200,
          maxWidth: 300,
          onRender: (item: any) => {
            const value = item[head.key]
            switch (head.itemType) {
              case 'text':
                return <TooltipWithEllipsis content={value} />
              case 'link':
                return <ForeignLink href={value}>More</ForeignLink>
              case 'size':
                return <ByteSizeWithDiff current={value} showDiffBellow={false} />
              case 'list':
                return (
                  <ul>
                    {value.map((v: any, i: number) => (
                      <li key={i}>{v}</li>
                    ))}
                  </ul>
                )
            }
          },
        }
      })
    }
    return []
  }, [detail])

  if (!detail.items.length) {
    return null
  }

  return (
    <Table<Unwrap<typeof detail.items>> items={detail.items} columns={columns} selectionMode={SelectionMode.none} />
  )
}

function AuditItem({ audit }: { audit: BundleAuditResult & { baseline?: BundleAuditResult } }) {
  const scoreItemsMap = useAuditScore()
  const icon = scoreItemsMap[audit.score].icon
  const theme = useTheme()

  const diffScore = useMemo(() => {
    if (audit.weight && audit.numericScore && audit.baseline) {
      return 100 * audit.numericScore.value - 100 * audit.baseline.numericScore!.value
    }

    return null
  }, [audit])

  return (
    <AuditItemBase
      title={audit.title}
      icon={icon}
      description={
        <>
          {audit.desc} {audit.link && <ForeignLink href={audit.link}>Learn more</ForeignLink>}
        </>
      }
      labels={
        audit.weight && audit.numericScore
          ? [
              audit.baseline && diffScore ? (
                <span style={{ whiteSpace: 'pre' }}>
                  Score: {(100 * audit.numericScore.value).toFixed(0)}
                  {'  '}
                  <span style={{ color: diffScore > 0 ? theme.colors.success : theme.colors.error }}>
                    {diffScore > 0 ? <RiseOutlined /> : <FallOutlined />} {diffScore.toFixed(0)}
                  </span>
                </span>
              ) : (
                `Score: ${(100 * audit.numericScore.value).toFixed(0)}`
              ),
              `Weight: ${audit.weight}`,
            ]
          : []
      }
    >
      {audit.detail && audit.detail.items.length > 0 && (
        <CollapsiblePanel header="Detail">
          <AuditItemDetail detail={audit.detail} />
        </CollapsiblePanel>
      )}
    </AuditItemBase>
  )
}

interface Props {
  audits: BundleAuditResult[]
  baseline?: BundleAuditResult[] | null
}

export const Audits: FC<Props> = (props) => {
  const audits = useMemo(() => {
    return props.audits.map((a) => {
      const baseline = props.baseline?.find((b) => b.id === a.id)
      return {
        ...a,
        baseline,
      }
    })
  }, [props.audits, props.baseline])
  const [notPassed, passed] = partition(audits, (audit) => audit.score < BundleAuditScore.Good)
  const [opportunities, diagnostics] = partition(notPassed, (a) => a.score <= BundleAuditScore.Warn)
  const [show, setShow] = useState(false)
  const onClick = useCallback(() => {
    setShow((show) => !show)
  }, [])
  return (
    <div style={{ margin: '12px 0' }}>
      {opportunities.length ? (
        <div>
          <AuditTitle>Opportunities &#8231; {opportunities.length}</AuditTitle>
          {opportunities.map((audit, i) => (
            <AuditItem key={i} audit={audit} />
          ))}
        </div>
      ) : null}
      {diagnostics.length ? (
        <div>
          <AuditTitle>Diagnostics &#8231; {diagnostics.length}</AuditTitle>
          {diagnostics.map((audit, i) => (
            <AuditItem key={i} audit={audit} />
          ))}
        </div>
      ) : null}
      {passed.length ? (
        <div>
          <AuditTitle>
            Passed &#8231; {passed.length}
            <CommandButton onClick={onClick}>{show ? 'Hide' : 'Show'}</CommandButton>
          </AuditTitle>
          {show ? passed.map((audit, i) => <AuditItem key={i} audit={audit} />) : null}
        </div>
      ) : null}
    </div>
  )
}
