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

import { QuestionCircleOutlined } from '@ant-design/icons'
import { css } from '@emotion/react'
import { HoverCard, IExpandingCardProps, HoverCardType, IPlainCardProps } from '@fluentui/react'
import { omit } from 'lodash'
import { ReactNode, memo } from 'react'

import { Card } from './style'

export type DocumentCardProps = React.HTMLProps<HTMLDivElement> & {
  shortDescription?: ReactNode
  fullDescription?: ReactNode
  icon?: ReactNode
  alwaysShowIcon?: boolean
  expandingCardProps?: IExpandingCardProps
}

interface ExpandingCardItem {
  compactCardChild: ReactNode
  expandingCardChild: ReactNode
}

export const DocumentCard = memo<DocumentCardProps>((props) => {
  const iconNode = props.shortDescription
    ? props.icon ?? <QuestionCircleOutlined size={12} style={{ cursor: 'pointer' }} />
    : null

  const expandingCardProps: IExpandingCardProps = {
    onRenderCompactCard,
    onRenderExpandedCard,
    renderData: {
      compactCardChild: props.shortDescription!,
      expandingCardChild: props.fullDescription!,
    },
    styles: {
      expandedCardScroll: {
        overflow: 'hidden',
        height: '100%',
      },
    },
    compactCardHeight: 'auto' as any,
    ...(props.expandingCardProps ?? {}),
  }

  const plainCardProps: IPlainCardProps = {
    onRenderPlainCard,
    renderData: {
      compactCardChild: props.shortDescription!,
    },
  }

  // Fixme hack emotion types
  const rawProps: React.HTMLProps<HTMLDivElement> & { as?: undefined } = omit(
    props,
    'as',
    'hoverText',
    'icon',
    'fullDescription',
    'shortDescription',
    'alwaysShowIcon',
    'expandingCardProps',
  )

  if (!props.shortDescription) {
    return <Card {...rawProps}>{props.children}</Card>
  }

  return (
    <Card {...rawProps}>
      {props.children}
      <HoverCard
        expandingCardProps={expandingCardProps}
        type={props.fullDescription ? HoverCardType.expanding : HoverCardType.plain}
        css={css({ position: 'absolute', right: '10px', top: '5px' })}
        plainCardProps={plainCardProps}
        cardOpenDelay={300}
        expandedCardOpenDelay={500}
        instantOpenOnClick={true}
      >
        {iconNode}
      </HoverCard>
    </Card>
  )
})

function onRenderCompactCard(data: ExpandingCardItem) {
  return <>{data.compactCardChild}</>
}

function onRenderExpandedCard(data: ExpandingCardItem) {
  return (
    <div
      css={css({
        height: '100%',
        padding: '10px 20px 40px 20px',
        overflow: 'auto',
      })}
    >
      {data.expandingCardChild}
    </div>
  )
}

function onRenderPlainCard(data: ExpandingCardItem) {
  return <>{data.compactCardChild}</>
}

export { Card }
