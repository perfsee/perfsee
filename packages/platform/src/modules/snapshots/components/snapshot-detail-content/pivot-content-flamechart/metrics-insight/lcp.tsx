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

import { Stack, Link, SharedColors, NeutralColors } from '@fluentui/react'
import { FC, memo, useCallback, useContext } from 'react'

import { NetworkRequest } from '@perfsee/flamechart'
import { TraceEvent, CauseForLcp, DomNode } from '@perfsee/shared'

import { SnapshotDetailType } from '../../../../snapshot-type'
import { LighthouseScoreBlock } from '../../pivot-content-overview/lighthouse-score-block'
import { FlamechartOperationContext } from '../context'

import {
  DetailContentContainer,
  DetailTitle,
  DetailKey,
  SlowedDownByItemContainer,
  ElementNodeContainer,
} from './styles'

interface InsightProps {
  snapshot: SnapshotDetailType
}

const formatNode = (node: DomNode) => {
  const copiedAttrbutes = node.attributes.slice()
  const attributes = Array.from({ length: copiedAttrbutes.length / 2 }, () => copiedAttrbutes.splice(0, 2))
  const klass = attributes.find((a) => a[0] === 'class')?.[1]
  const id = attributes.find((a) => a[0] === 'id')?.[1]
  const others = attributes.filter((a) => a[0] !== 'id' && a[0] !== 'class')

  return (
    <ElementNodeContainer>
      <span style={{ color: NeutralColors.gray120, fontWeight: 600 }}>{node.localName}</span>
      {klass ? (
        <span style={{ color: SharedColors.cyan30 }}>
          {klass
            .split(' ')
            .map((k) => `.${k}`)
            .join('')}
        </span>
      ) : null}
      {id ? (
        <span style={{ color: SharedColors.blue10 }}>
          {id
            .split(' ')
            .map((i) => `#${i}`)
            .join('')}
        </span>
      ) : null}
      {others.length ? (
        <span style={{ color: SharedColors.orangeYellow20 }}>
          {others.map(([key, val]) => `[${key}="${val}"]`).join('')}
        </span>
      ) : null}
    </ElementNodeContainer>
  )
}

const CriticalPath = ({ request }: { request: NetworkRequest }) => {
  const focuseFrame = useContext(FlamechartOperationContext).focuseFrame

  const onClickLink = useCallback(() => {
    const url = request.url
    if (url) {
      const urlObj = new URL(url)
      focuseFrame(urlObj.pathname)
    }
  }, [focuseFrame, request.url])

  return (
    <Stack tokens={{ childrenGap: 10 }}>
      <DetailTitle>Critical Path For LCP Resource</DetailTitle>
      <DetailContentContainer>
        <Link onClick={onClickLink}>{request.url}</Link>
      </DetailContentContainer>
    </Stack>
  )
}

const SlowedDownByLongtask = ({ longtask }: { longtask: TraceEvent }) => {
  const focuseFrame = useContext(FlamechartOperationContext).focuseFrame

  const firstStack = longtask.hotFunctionsStackTraces?.[0]?.[0]

  const onClick = useCallback(() => {
    const key = firstStack
      ? `${firstStack.functionName || '(anonymous)'}:${firstStack.url ?? ''}:${
          typeof firstStack.lineNumber === 'number' ? firstStack.lineNumber + 1 : 0
        }:${typeof firstStack.columnNumber === 'number' ? firstStack.columnNumber + 1 : 0}`
      : ''
    focuseFrame(key)
  }, [focuseFrame, firstStack])

  if (!firstStack) {
    return null
  }

  const functionStack = firstStack ? (
    <Stack horizontal>
      <DetailKey>Function</DetailKey>
      <Link onClick={onClick}>
        {firstStack.functionName || '(anonymous)'}{' '}
        {firstStack.url ? `(${firstStack.url}:${firstStack.lineNumber + 1}:${firstStack.columnNumber + 1})` : null}
      </Link>
    </Stack>
  ) : null
  return (
    <SlowedDownByItemContainer>
      <Stack horizontal styles={{ root: { marginBottom: 4 } }}>
        <DetailKey>Type</DetailKey>
        <Stack horizontal styles={{ root: { whiteSpace: 'pre' } }}>
          Long Task{' '}
          <Link href="https://web.dev/efficiently-load-third-party-javascript" target="_blank">
            (how to fix)
          </Link>
        </Stack>
      </Stack>
      {functionStack}
    </SlowedDownByItemContainer>
  )
}

const SlowedDownByRequest = ({ network }: { network: TraceEvent }) => {
  const focuseFrame = useContext(FlamechartOperationContext).focuseFrame

  const onClickLink = useCallback(() => {
    const url = network.args.data?.url
    if (url) {
      const urlObj = new URL(url)
      focuseFrame(urlObj.pathname)
    }
  }, [focuseFrame, network.args.data?.url])

  return (
    <SlowedDownByItemContainer>
      <Stack horizontal styles={{ root: { marginBottom: 4 } }}>
        <DetailKey>Type</DetailKey>
        <Stack horizontal styles={{ root: { whiteSpace: 'pre' } }}>
          Render Blocking Request{' '}
          <Link
            href="https://developer.chrome.com/docs/lighthouse/performance/render-blocking-resources"
            target="_blank"
          >
            (how to fix)
          </Link>
        </Stack>
      </Stack>
      <Stack horizontal>
        <DetailKey>Resource</DetailKey>
        <Link onClick={onClickLink}>{network.args.data?.url}</Link>
      </Stack>
    </SlowedDownByItemContainer>
  )
}

const SlowedDownBy = ({ causeForLCP }: { causeForLCP: CauseForLcp }) => {
  const { longtasks, networkBlockings } = causeForLCP

  if (!longtasks.length && !networkBlockings.length) {
    return null
  }

  const slowedDownItems = [...longtasks, ...networkBlockings].sort((a, b) => {
    if (a.ts < b.ts) {
      return -1
    }
    if (a.ts > b.ts) {
      return 1
    }
    const aEnd = a.ts + (a.dur ?? 0)
    const bEnd = b.ts + (b.dur ?? 0)
    if (aEnd > bEnd) {
      return -1
    }
    if (aEnd < bEnd) {
      return 1
    }
    return 0
  })

  return (
    <Stack tokens={{ childrenGap: 10 }}>
      <DetailTitle>Slowed Down By</DetailTitle>
      {slowedDownItems.map((e, i) => {
        if (e.name === 'RunTask') {
          return <SlowedDownByLongtask longtask={e} key={i} />
        }
        return <SlowedDownByRequest network={e} key={i} />
      })}
    </Stack>
  )
}

const TimingBreakdownTotalWidth = 350

const TimingBreakdown = ({ causeForLCP, lcp }: { causeForLCP: CauseForLcp; lcp: number }) => {
  const { navigationTimeToFirstByte, resourceLoadDelay, resourceLoadTime } = causeForLCP.metrics
  const haveRequest = !!causeForLCP.criticalPathForLcp?.request
  const elementRenderDelay = haveRequest
    ? lcp - ((navigationTimeToFirstByte ?? 0) + (resourceLoadDelay ?? 0) + (resourceLoadTime ?? 0))
    : (lcp = navigationTimeToFirstByte ?? 0)
  const total = lcp

  return (
    <Stack tokens={{ childrenGap: 16 }}>
      <DetailTitle>Timing Breakdown</DetailTitle>
      {navigationTimeToFirstByte ? (
        <Stack horizontal>
          <DetailKey>Time To Frist Byte</DetailKey>
          <Stack horizontal>
            <Stack
              styles={{
                root: {
                  background: SharedColors.blue10,
                  width: (TimingBreakdownTotalWidth * navigationTimeToFirstByte) / total,
                  marginRight: 4,
                },
              }}
            />
            {navigationTimeToFirstByte?.toFixed(2)}ms
          </Stack>
        </Stack>
      ) : null}
      {resourceLoadDelay && haveRequest ? (
        <Stack horizontal>
          <DetailKey>Resource Load Delay</DetailKey>
          <Stack horizontal>
            <Stack
              styles={{
                root: {
                  background: SharedColors.cyan10,
                  width: (TimingBreakdownTotalWidth * resourceLoadDelay) / total,
                  marginLeft: (TimingBreakdownTotalWidth * (navigationTimeToFirstByte ?? 0)) / total,
                  marginRight: 4,
                },
              }}
            />
            {resourceLoadDelay?.toFixed(2)}ms
          </Stack>
        </Stack>
      ) : null}
      {resourceLoadTime && haveRequest ? (
        <Stack horizontal>
          <DetailKey>Resource Load Time</DetailKey>
          <Stack horizontal>
            <Stack
              styles={{
                root: {
                  background: SharedColors.greenCyan10,
                  width: (TimingBreakdownTotalWidth * resourceLoadTime) / total,
                  marginLeft:
                    (TimingBreakdownTotalWidth * ((resourceLoadDelay ?? 0) + (navigationTimeToFirstByte ?? 0))) / total,
                  marginRight: 4,
                },
              }}
            />
            {resourceLoadTime?.toFixed(2)}ms
          </Stack>
        </Stack>
      ) : null}
      {elementRenderDelay ? (
        <Stack horizontal>
          <DetailKey>Element Render Delay</DetailKey>
          <Stack horizontal>
            {' '}
            <Stack
              styles={{
                root: {
                  background: SharedColors.yellow10,
                  width: (TimingBreakdownTotalWidth * elementRenderDelay) / total,
                  marginLeft: haveRequest
                    ? (TimingBreakdownTotalWidth *
                        ((resourceLoadDelay ?? 0) + (navigationTimeToFirstByte ?? 0) + (resourceLoadTime ?? 0))) /
                      total
                    : (TimingBreakdownTotalWidth * (navigationTimeToFirstByte ?? 0)) / total,
                  marginRight: 4,
                },
              }}
            />
            {elementRenderDelay?.toFixed(2)}ms
          </Stack>
        </Stack>
      ) : null}
    </Stack>
  )
}

export const LCPInsight: FC<InsightProps> = memo(({ snapshot }) => {
  // @ts-expect-error
  const causeForLCP: CauseForLcp = snapshot.audits['cause-for-lcp']?.details?.items[0]
  // @ts-expect-error
  const lcpElementAudit = snapshot.audits['largest-contentful-paint-element']?.details?.items[0]
  const lcpValue = snapshot.audits['largest-contentful-paint']?.numericValue
  const lcpScore = snapshot.metricScores?.find((score) => score.id === 'largest-contentful-paint')

  if (!lcpScore || !causeForLCP) {
    return null
  }

  const LcpElement = causeForLCP.LcpElement ? (
    <Stack tokens={{ childrenGap: 10 }}>
      <DetailTitle>LCP Element</DetailTitle>
      <DetailContentContainer>
        <Stack horizontal>
          <DetailKey>Element</DetailKey>
          {formatNode(causeForLCP.LcpElement.node)}
        </Stack>
      </DetailContentContainer>
      <Stack horizontal>
        <DetailKey>Selector</DetailKey>
        <span style={{ color: NeutralColors.gray130 }}>{lcpElementAudit?.node?.selector}</span>
      </Stack>
      <Stack horizontal>
        <DetailKey>Width</DetailKey>
        {causeForLCP.LcpElement.boxModel.width}px
      </Stack>
      <Stack horizontal>
        <DetailKey>Height</DetailKey>
        {causeForLCP.LcpElement.boxModel.height}px
      </Stack>
    </Stack>
  ) : null

  return (
    <Stack tokens={{ childrenGap: 12 }}>
      <Stack styles={{ root: { margin: '-12px -16px' } }}>
        <LighthouseScoreBlock detail={lcpScore} colorful hideTitle />
      </Stack>
      {LcpElement}
      <SlowedDownBy causeForLCP={causeForLCP} />
      {causeForLCP.criticalPathForLcp?.request ? (
        <CriticalPath request={causeForLCP.criticalPathForLcp.request} />
      ) : null}
      <TimingBreakdown causeForLCP={causeForLCP} lcp={lcpValue ?? 0} />
    </Stack>
  )
})
