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
import { HoverCard, HoverCardType, IHoverCardProps, Stack } from '@fluentui/react'
import { ComponentType } from 'react'

import { LazyMDX } from '@perfsee/components'

import { BundleCard, BundleCardTitle, cardGap } from '../style'
import { ArtifactDiff, EntryDiff, Size } from '../types'

import { BriefSize } from './brief-size'
import { ScoreCircle } from './score'
import { EmphasisSizeDiff, EmphasisNumberDiff, ExpandingCardWrapper } from './style'

interface OverviewProps {
  artifact: ArtifactDiff
  diff: EntryDiff
}

const cardGroups: Array<
  Array<{
    title: string
    diffField: keyof EntryDiff
    desc?: string
    detail?: () => Promise<ComponentType>
  }>
> = [
  [
    {
      title: 'Bundle Size',
      diffField: 'sizeDiff',
    },
    {
      title: 'Initial JS Size',
      diffField: 'initialJsSizeDiff',
    },
    {
      title: 'Initial CSS Size',
      diffField: 'initialCssSizeDiff',
    },
    {
      title: 'Cache Invalidation',
      diffField: 'cacheInvalidation',
      desc: 'Total size of new assets',
      detail: () =>
        import(/* webpackChunkName: "bundle-docs" */ './docs/cache-invalidation.mdx').then((res) => res.default),
    },
  ],
  [
    {
      title: 'Assets Count',
      diffField: 'assetsCountDiff',
      desc: 'Total number of asset files emitted.',
      detail: () => import(/* webpackChunkName: "bundle-docs" */ './docs/asset.mdx').then((res) => res.default),
    },
    {
      title: 'Chunks Count',
      diffField: 'chunksCountDiff',
      desc: 'Total number of chunks generated.',
      detail: () => import(/* webpackChunkName: "bundle-docs" */ './docs/chunk.mdx').then((res) => res.default),
    },
    {
      title: 'Packages Count',
      diffField: 'packagesCountDiff',
      desc: 'Total number of packages bundled.',
      detail: () => import(/* webpackChunkName: "bundle-docs" */ './docs/package.mdx').then((res) => res.default),
    },
    {
      title: 'Duplicated Packages Count',
      diffField: 'duplicatedPackagesCountDiff',
      desc: 'Total number of packages that are duplicated.',
      detail: () =>
        import(/* webpackChunkName: "bundle-docs" */ './docs/duplicated-package.mdx').then((res) => res.default),
    },
  ],
]

export function Overview({ artifact, diff }: OverviewProps) {
  return (
    <Stack tokens={cardGap}>
      <Stack horizontal tokens={cardGap} wrap>
        <Stack.Item grow={1}>
          <BundleCard>
            <BundleCardTitle>Bundle Score</BundleCardTitle>
            <ScoreCircle
              score={diff.score.current ?? artifact.score}
              baseline={diff.score.baseline ?? artifact.baseline?.score}
            />
          </BundleCard>
        </Stack.Item>
        <Stack.Item grow={4}>
          <BundleCard>
            <BundleCardTitle>Bundle Overview</BundleCardTitle>
            <BriefSize diff={diff} />
          </BundleCard>
        </Stack.Item>
      </Stack>
      {cardGroups.map((items, i) => (
        <Stack key={i} horizontal tokens={cardGap} wrap>
          {items.map((item) => {
            const diffData = diff[item.diffField]
            if (!('current' in diffData)) {
              return null
            }

            let content = null
            if (typeof diffData.current === 'number') {
              content = (
                <EmphasisNumberDiff
                  current={diffData.current}
                  baseline={diffData.baseline as number}
                  showPercentile={false}
                />
              )
            } else if (diffData.current && 'raw' in diffData.current) {
              content = <EmphasisSizeDiff current={diffData.current} baseline={diffData.baseline as Size} />
            }

            if (!content) {
              return null
            }

            const hoverCardProps: IHoverCardProps = item.desc
              ? {
                  type: item.detail ? HoverCardType.expanding : HoverCardType.plain,
                  cardOpenDelay: 300,
                  expandedCardOpenDelay: 300,
                  expandingCardProps: item.detail
                    ? {
                        onRenderCompactCard: () => <ExpandingCardWrapper>{item.desc}</ExpandingCardWrapper>,
                        onRenderExpandedCard: () => (
                          <ExpandingCardWrapper>
                            <LazyMDX loadMDX={item.detail!} />
                          </ExpandingCardWrapper>
                        ),
                        styles: {
                          compactCard: {
                            height: 'auto',
                          },
                          expandedCardScroll: {
                            height: 'calc(100% - 20px)',
                            overflow: 'auto',
                          },
                        },
                      }
                    : undefined,
                  plainCardProps: item.detail
                    ? undefined
                    : {
                        onRenderPlainCard: () => <ExpandingCardWrapper>{item.desc}</ExpandingCardWrapper>,
                      },
                }
              : {}

            return (
              <Stack.Item key={item.title} grow={1}>
                <BundleCard shortDescription={item.desc}>
                  <BundleCardTitle>
                    {item.title}
                    {item.desc && (
                      <HoverCard {...hoverCardProps}>
                        <QuestionCircleOutlined size={12} style={{ cursor: 'pointer' }} />
                      </HoverCard>
                    )}
                  </BundleCardTitle>
                  {content}
                </BundleCard>
              </Stack.Item>
            )
          })}
        </Stack>
      ))}
    </Stack>
  )
}
