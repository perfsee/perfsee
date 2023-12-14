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

import { Link, Stack } from '@fluentui/react'
import { FC, memo } from 'react'

import {
  LHGauge,
  LHGaugeArc,
  LHGaugeBase,
  LHGaugeContainer,
  LHGaugePercentage,
  LHGaugeLabel,
  LHGaugeDescription,
  LHGaugeScoreScale,
  LHGaugeScoreScaleFail,
  LHGaugeScoreScaleAverage,
  LHGaugeScoreScalePassed,
} from './style'

export interface ScoreProps {
  category: LH.Result.Category
}

const categoryDescirptions = {
  performance: (
    <p>
      Values are estimated and may vary.{' '}
      <Link href="https://developer.chrome.com/docs/lighthouse/performance/performance-scoring" target="_blank">
        The performance score is calculated
      </Link>{' '}
      directly from these metrics.{' '}
      <Link href="https://googlechrome.github.io/lighthouse/scorecalc" target="_blank">
        See calculator.
      </Link>
    </p>
  ),
  accessibility: (
    <p>
      These checks highlight opportunities to{' '}
      <Link href="https://developer.chrome.com/docs/lighthouse/accessibility/scoring" target="_blank">
        improve the accessibility of your web app
      </Link>
      . Automatic detection can only detect a subset of issues and does not guarantee the accessibility of your web app,
      so{' '}
      <Link href="https://web.dev/articles/how-to-review" target="_blank">
        manual testing
      </Link>{' '}
      is also encouraged.
    </p>
  ),
  seo: (
    <p>
      These checks ensure that your page is following basic search engine optimization advice. There are many additional
      factors Lighthouse does not score here that may affect your search ranking, including performance on{' '}
      <Link href="https://web.dev/explore/learn-core-web-vitals" target="_blank">
        Core Web Vitals
      </Link>
      .{' '}
      <Link href="https://developers.google.com/search/docs/essentials" target="_blank">
        Learn more about Google Search Essentials
      </Link>
      .
    </p>
  ),
  pwa: (
    <p>
      These checks validate the aspects of a Progressive Web App.{' '}
      <Link href="https://web.dev/articles/pwa-checklist" target="_blank">
        Learn what makes a good Progressive Web App
      </Link>
      .
    </p>
  ),
}

const PI = 3.1415926

export const ScoreCircle = ({
  score,
  size,
  fontSize,
}: {
  score?: number | null
  size?: number | string
  fontSize?: number | string
}) => {
  return (
    <LHGaugeContainer
      className={
        typeof score === 'number' ? (score >= 0.9 ? 'passed' : score >= 0.5 ? 'average' : 'fail') : 'unavalible'
      }
    >
      <LHGauge viewBox="0 0 120 120" style={{ width: size, height: size }}>
        <LHGaugeBase r="56" cx="60" cy="60" strokeWidth="8" />
        <LHGaugeArc
          r="56"
          cx="60"
          cy="60"
          strokeWidth="8"
          style={{
            transform: 'rotate(-90deg)',
            strokeDasharray: `${2 * PI * 56 * (score ?? 0)}, ${2 * PI * 56}`,
          }}
        />
      </LHGauge>
      <LHGaugePercentage style={{ fontSize }}>
        {typeof score === 'number' ? (score * 100).toFixed(0) : '-'}
      </LHGaugePercentage>
    </LHGaugeContainer>
  )
}

export const LHScore: FC<ScoreProps> = memo(({ category }) => {
  const { score, title } = category
  return (
    <Stack verticalAlign="center" horizontalAlign="center" tokens={{ childrenGap: '16px' }}>
      <ScoreCircle score={score} size="6rem" fontSize="2rem" />
      <LHGaugeLabel>{title}</LHGaugeLabel>
      <LHGaugeDescription>{categoryDescirptions[category.id]}</LHGaugeDescription>
      <LHGaugeScoreScale>
        <LHGaugeScoreScaleFail>
          <span>90-100</span>
        </LHGaugeScoreScaleFail>
        <LHGaugeScoreScaleAverage>
          <span>50-89</span>
        </LHGaugeScoreScaleAverage>
        <LHGaugeScoreScalePassed>
          <span>90-100</span>
        </LHGaugeScoreScalePassed>
      </LHGaugeScoreScale>
    </Stack>
  )
})
