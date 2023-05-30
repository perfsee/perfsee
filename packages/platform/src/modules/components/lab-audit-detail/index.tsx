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

import { SelectionMode, IColumn, Image } from '@fluentui/react'
import { useMemo, FC } from 'react'

import { disabledVirtualization, TooltipWithEllipsis, Table, CollapsiblePanel } from '@perfsee/components'
import { formatMsDuration } from '@perfsee/platform/common'

import { LighthouseAudit } from '../../snapshots/snapshot-type'

import { StyledBorderWrapper } from './style'

type Head1 = {
  label?: string
  valueType?: string
}
type Head2 = {
  text?: string
  itemType?: string
}

type DetailHeading = { key: string } & Head1 & Head2

export type DetailProps = Pick<LighthouseAudit, 'details'>

const nonListDetailTypes: Array<NonNullable<DetailProps['details']>['type']> = [
  'criticalrequestchain',
  'debugdata',
  'screenshot',
  // @ts-expect-error
  'full-page-screenshot',
]

export const LabAuditDetail = (props: DetailProps) => {
  const { details } = props

  const columns = useMemo(
    () =>
      // @ts-expect-error
      details?.headings?.map((head, index) => {
        return {
          ...head,
          key: `${head.key}${index}`,
          name: head.label ?? head.text ?? '',
          fieldName: head.key,
          minWidth: 80,
          maxWidth: getMaxWidth(head.valueType ?? head.itemType),
        }
      }),
    [details],
  )

  // @ts-expect-error
  if (!details || nonListDetailTypes.includes(details.type) || !details.items?.length) {
    return null
  }

  return (
    <Table
      // @ts-expect-error
      items={details.items}
      selectionMode={SelectionMode.none}
      onRenderItemColumn={onRenderCell}
      onShouldVirtualize={disabledVirtualization}
      columns={columns}
    />
  )
}

const getMaxWidth = (type?: string) => {
  return type === 'thumbnail' ? 80 : type === 'bytes' ? 200 : 400
}

const getContentFromType = (type: string, content: any) => {
  switch (type) {
    case 'bytes':
      return (content / 1024).toFixed(1) + 'KiB'
    case 'url':
      return <TooltipWithEllipsis content={content} />
    case 'ms':
    case 'timespanMs':
      return formatMsDuration(content, true)
    case 'link':
      return content.text
    case 'code':
      return typeof content === 'string' ? content : content.value
    case 'source-location':
      return content.url
    case 'node':
      return <TableItemNode content={content} />
    case 'thumbnail':
      return (
        <Image
          src={content}
          width={50}
          height={50}
          styles={{ image: { height: 'auto' }, root: { overflow: 'hidden' } }}
          alt=""
        />
      )
    case 'numeric':
      return content
    default:
      return typeof content !== 'object' ? String(content) : ''
  }
}

const onRenderCell = (item?: any, _index?: number, column?: IColumn & DetailHeading) => {
  if (!column || !column.fieldName) {
    return null
  }

  return getContentFromType(column.valueType ?? column.itemType ?? '', item[column.fieldName])
}

type TableItemNodeProps = {
  content?: {
    snippet: string
    explanation?: string
    nodeLabel?: string
  }
}

const TableItemNode: FC<TableItemNodeProps> = (props) => {
  const { content } = props
  if (!content) {
    return null
  }
  return (
    <StyledBorderWrapper>
      {content.explanation ?? content.nodeLabel}
      <div>{content.snippet}</div>
    </StyledBorderWrapper>
  )
}

export const LabAuditDetailWithPanel = ({ details }: DetailProps) => {
  // @ts-expect-error
  if (!details?.items?.length) {
    return null
  }

  return (
    <CollapsiblePanel header="Detail">
      <LabAuditDetail details={details} />
    </CollapsiblePanel>
  )
}
