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

import { PivotItem, Stack } from '@fluentui/react'
import { uniqueId } from 'lodash'
import { ReactNode, memo } from 'react'

import { RequestSchema, StackTrack } from '@perfsee/shared'

import { StyledPivot, StyledLink, StyledInfoItem, StyledInfoKey } from './style'

type Props = { item: RequestSchema }

export const TableExtraInfo = (props: Props) => {
  const { item } = props
  const { responseHeader, requestHeader } = item as RequestSchema

  const response = Object.keys(responseHeader)?.map((key) => {
    return (
      <StyledInfoItem key={key}>
        <StyledInfoKey>{key}:</StyledInfoKey>
        {responseHeader[key]}
      </StyledInfoItem>
    )
  })

  const request = Object.keys(requestHeader)?.map((key) => {
    return (
      <StyledInfoItem key={key}>
        <StyledInfoKey>{key}:</StyledInfoKey>
        {requestHeader[key]}
      </StyledInfoItem>
    )
  })
  return (
    <Stack>
      <StyledLink href={item.url}>{item.url}</StyledLink>
      <StyledPivot styles={{ itemContainer: { width: '100%', padding: '8px' } }}>
        <PivotItem headerText="Response headers">{response}</PivotItem>
        <PivotItem headerText="Request headers">{request}</PivotItem>
        <PivotItem headerText="Initiator">
          <TableInitiator item={item} />
        </PivotItem>
      </StyledPivot>
    </Stack>
  )
}

export const TableInitiator = memo(({ item }: { item: RequestSchema }) => {
  const { initiator } = item

  if (!initiator) {
    return null
  }

  const { url, lineNumber, columnNumber, stack, type } = initiator

  if (url) {
    return (
      <StyledInfoItem>
        <StyledInfoKey>
          {url}
          {typeof lineNumber === 'number' && typeof columnNumber === 'number' ? `:${lineNumber}:${columnNumber}` : ''}
        </StyledInfoKey>
      </StyledInfoItem>
    )
  }

  if (stack) {
    return <>{traverseStack(stack)}</>
  }

  return (
    <StyledInfoItem>
      <StyledInfoKey>{type}</StyledInfoKey>
    </StyledInfoItem>
  )
})

const traverseStack = (stack: StackTrack): ReactNode[] => {
  const elements = []

  if (stack.description) {
    elements.push(
      <StyledInfoItem key={uniqueId()}>
        <StyledInfoKey>{stack.description} (async)</StyledInfoKey>
      </StyledInfoItem>,
    )
  }

  elements.push(
    stack.callFrames.map((frame) => {
      return (
        <StyledInfoItem key={uniqueId()}>
          <StyledInfoKey>{frame.functionName || '(anonymous)'}</StyledInfoKey>
          {`${frame.url}:${frame.lineNumber}:${frame.columnNumber}`}
        </StyledInfoItem>
      )
    }),
  )

  if (stack.parent) {
    elements.push(...traverseStack(stack.parent))
  }

  return elements
}
