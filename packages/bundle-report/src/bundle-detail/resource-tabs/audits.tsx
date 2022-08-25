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

import { SelectionMode } from '@fluentui/react'
import { FC, useMemo } from 'react'

import {
  CollapsiblePanel,
  TooltipWithEllipsis,
  Table,
  ForeignLink,
  AuditItem as AuditItemBase,
} from '@perfsee/components'
import { BundleAuditResult, BundleAuditDetail } from '@perfsee/shared'

import { ByteSizeWithDiff } from '../components'

import { useAuditScore } from './use-audit-score'

type Unwrap<T> = T extends Array<infer S> ? S : unknown

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

function AuditItem({ audit }: { audit: BundleAuditResult }) {
  const scoreItemsMap = useAuditScore()
  const icon = scoreItemsMap[audit.score].icon

  return (
    <AuditItemBase
      title={audit.title}
      icon={icon}
      description={
        <>
          {audit.desc} {audit.link && <ForeignLink href={audit.link}>Learn more</ForeignLink>}
        </>
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
}

export const Audits: FC<Props> = ({ audits }) => {
  return (
    <div>
      {audits.map((audit, i) => (
        <AuditItem key={i} audit={audit} />
      ))}
    </div>
  )
}
