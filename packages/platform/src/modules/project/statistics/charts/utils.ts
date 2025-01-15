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

import { MetricType, LighthouseScoreMetric, MetricKeyType } from '@perfsee/shared'

type MetricFormatter = 'duration' | 'unitless' | 'decimal'

export const Metrics: {
  [k in MetricKeyType]?: {
    title: string
    des: string
    formatter: MetricFormatter
  }
} = {
  [MetricType.FCP]: {
    title: 'First Contentful Paint',
    des: 'FCP is the moment when text is first visible.',
    formatter: 'duration',
  },
  [MetricType.LCP]: {
    title: 'Largest Contentful Paint ',
    des: 'LCP measures when the largest content element becomes visible in the viewport',
    formatter: 'duration',
  },
  [MetricType.FMP]: {
    title: 'First Meaningful Paint(Deprecated)',
    des: 'FMP is the time at which the largest area of above-the-fold content was painted to the screen.',
    formatter: 'duration',
  },
  [MetricType.CLS]: {
    title: 'Cumulative Layout Shift',
    des: 'CLS is the sum of scores from all of the unstable elements that move around during page load.',
    formatter: 'decimal',
  },
  [MetricType.TBT]: {
    title: 'Total Blocking Time',
    des: 'TBT is a time based metric that describes JavaScript main thread activity.',
    formatter: 'duration',
  },
  [MetricType.SI]: {
    title: 'Speed Index',
    des: 'SI is a method of calculating a score that indicates the time it took a page to become visually complete.',
    formatter: 'duration',
  },
  [MetricType.TTI]: {
    title: 'Time to Interactive',
    des: 'TTI measures the moment at which the main thread has had 5 seconds with no network activity or JavaScript long tasks.',
    formatter: 'duration',
  },
  [MetricType.MPFID]: {
    title: 'Max Potential FID',
    des: 'Max Potential FID measures the worst-case First Input Delay that your users might experience.',
    formatter: 'duration',
  },
  [LighthouseScoreMetric.Performance]: {
    title: 'Performance Score',
    des: 'A number ranging from 0 to 100 evaluating the observed performance characteristics of a given page.',
    formatter: 'unitless',
  },
  [LighthouseScoreMetric.Accessibility]: {
    title: 'Accessibility Score',
    des: 'A number ranging from 0 to 100 evaluating the accessibility properties of a given page.',
    formatter: 'unitless',
  },
  [LighthouseScoreMetric.SEO]: {
    title: 'SEO Score',
    des: 'A number ranging from 0 to 100 evaluating the SEO potential of a page from pre-defined audits.',
    formatter: 'unitless',
  },
  [LighthouseScoreMetric.BestPractices]: {
    title: 'Best Practices Score',
    des: 'A number ranging from 0 to 100 evaluating the implementation of a given page in relation to common best practices.',
    formatter: 'unitless',
  },
  [LighthouseScoreMetric.PWA]: {
    title: 'PWA Score',
    des: 'A number ranging from 0 to 100 evaluating if a page meets the Progressive Web App definition guidelines.',
    formatter: 'unitless',
  },
}
