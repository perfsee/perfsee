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
import { CommandButton, Link, SelectionMode, SharedColors } from '@fluentui/react'
import { partition } from 'lodash'
import { parse, stringify } from 'query-string'
import { FC, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

import {
  CollapsiblePanel,
  TooltipWithEllipsis,
  Table,
  ForeignLink,
  AuditItem as AuditItemBase,
} from '@perfsee/components'
import { BundleAuditResult, BundleAuditDetail, BundleAuditScore, PrettyBytes } from '@perfsee/shared'

import { RouterContext } from '../../router-context'
import { ByteSizeWithDiff } from '../components'
import { ModuleTraceContext, PackageTraceContext } from '../context'

import { TraceType } from './code'
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

export function AuditItemDetail({
  detail,
  onClickTrace,
  onClickSideEffects,
}: {
  detail: BundleAuditDetail
  onClickTrace?: (ref: number) => void
  onClickSideEffects?: (path: string) => void
}) {
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
          minWidth: 120,
          maxWidth: head.itemType === 'list' ? 600 : 300,
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
                  <ul style={{ width: '100%' }}>
                    {value.map((v: any, i: number) => (
                      <li key={i}>{<TooltipWithEllipsis content={v} />}</li>
                    ))}
                  </ul>
                )
              case 'trace':
                if (!onClickTrace) {
                  return null
                }
                if (Array.isArray(value)) {
                  return (
                    <ul>
                      {value.map((v: any, i: number) => (
                        <li key={i} style={{ height: 18 }}>
                          {
                            // eslint-disable-next-line
                            <Link onClick={() => onClickTrace(v)}>Trace</Link>
                          }
                        </li>
                      ))}
                    </ul>
                  )
                }
                // eslint-disable-next-line
                return <Link onClick={() => onClickTrace(value)}>Trace</Link>
              case 'sideEffects':
                if (!onClickSideEffects) {
                  return null
                }
                if (Array.isArray(value)) {
                  return (
                    <ul>
                      {value.map((v: any, i: number) => (
                        <li key={i} style={{ visibility: v ? 'unset' : 'hidden', height: 18 }}>
                          {
                            // eslint-disable-next-line
                            <Link onClick={() => onClickSideEffects?.(v)}>Trace</Link>
                          }
                        </li>
                      ))}
                    </ul>
                  )
                }
                // eslint-disable-next-line
                return <Link onClick={() => onClickSideEffects?.(value)}>Trace</Link>
            }
          },
        }
      })
    }
    return []
  }, [detail, onClickTrace, onClickSideEffects])

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
  const queries: { trace?: string; tab?: string; audit?: string } = parse(location.search)
  const { history } = useContext(RouterContext)
  const packageTraceContext = useContext(PackageTraceContext)
  const moduleTraceContext = useContext(ModuleTraceContext)
  const scrollElement = useRef<HTMLSpanElement>(null)

  const onClickTrace = useCallback(
    (ref: number) => {
      if (packageTraceContext.setRef) {
        packageTraceContext.setRef(ref)
      } else if (queries.trace !== String(ref)) {
        history?.push(`${location.pathname}?${stringify({ ...queries, trace: ref })}`)
      }
    },
    [history, queries, packageTraceContext],
  )

  const onClickSideEffects = useCallback(
    (path: string) => {
      moduleTraceContext.setModule?.(path, TraceType.SideEffects)
    },
    [moduleTraceContext],
  )

  const isFocused = queries.audit && queries.audit === audit.id
  useEffect(() => {
    if (isFocused && audit.score <= 2) {
      scrollElement.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }
  }, [isFocused, audit.score])

  const diffScore = useMemo(() => {
    if (audit.weight && audit.numericScore && audit.baseline) {
      return 100 * audit.numericScore.value - 100 * audit.baseline.numericScore!.value
    }

    return null
  }, [audit])

  const labels = useMemo(() => {
    const labels =
      audit.weight && audit.numericScore
        ? [
            audit.baseline && diffScore && Math.abs(diffScore) >= 0.5 ? (
              <span style={{ whiteSpace: 'pre' }}>
                Score: {(100 * audit.numericScore.value).toFixed(0)}
                {'  '}
                <span style={{ color: diffScore > 0 ? theme.colors.success : theme.colors.error }}>
                  {diffScore > 0 ? <RiseOutlined /> : <FallOutlined />} {diffScore > 0 ? '+' : '-'}
                  {Math.abs(diffScore).toFixed(0)}
                </span>
              </span>
            ) : (
              `Score: ${(100 * audit.numericScore.value).toFixed(0)}`
            ),
            `Weight: ${audit.weight}`,
          ]
        : []

    if (audit.count) {
      labels.push(`Count: ${audit.count}`)
    }

    if (audit.size) {
      labels.push(`Size: ${PrettyBytes.create(audit.size.raw).toString()}`)
    }

    return labels
  }, [audit, theme, diffScore])

  return (
    <AuditItemBase
      title={
        <span ref={scrollElement} style={{ background: isFocused ? SharedColors.yellow10 : 'unset' }}>
          {audit.title}
        </span>
      }
      icon={icon}
      description={
        <>
          {audit.desc} {audit.link && <ForeignLink href={audit.link}>Learn more</ForeignLink>}
        </>
      }
      labels={labels}
    >
      {audit.detail && audit.detail.items.length > 0 && (
        <CollapsiblePanel header="Detail" defaultCollapsed={!isFocused}>
          <AuditItemDetail detail={audit.detail} onClickTrace={onClickTrace} onClickSideEffects={onClickSideEffects} />
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
          {opportunities.map((audit) => (
            <AuditItem key={audit.id} audit={audit} />
          ))}
        </div>
      ) : null}
      {diagnostics.length ? (
        <div>
          <AuditTitle>Diagnostics &#8231; {diagnostics.length}</AuditTitle>
          {diagnostics.map((audit) => (
            <AuditItem key={audit.id} audit={audit} />
          ))}
        </div>
      ) : null}
      {passed.length ? (
        <div>
          <AuditTitle>
            Passed &#8231; {passed.length}
            <CommandButton onClick={onClick}>{show ? 'Hide' : 'Show'}</CommandButton>
          </AuditTitle>
          {show ? passed.map((audit) => <AuditItem key={audit.id} audit={audit} />) : null}
        </div>
      ) : null}
    </div>
  )
}
