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

export enum LighthouseScoreMetric {
  Performance = 'performance',
  PWA = 'pwa',
  SEO = 'seo',
  Accessibility = 'accessibility',
  BestPractices = 'best-practices',
}

export enum MetricType { // For homepage aggregation metrics chart
  FCP = 'first-contentful-paint',
  FMP = 'first-meaningful-paint',
  LCP = 'largest-contentful-paint',
  SI = 'speed-index',
  TBT = 'total-blocking-time',
  TTI = 'interactive',
  MPFID = 'max-potential-fid',
  CLS = 'cumulative-layout-shift',
  WS = 'white-screen',
}

type MetricUnion = Pick<typeof MetricType, 'FCP' | 'LCP' | 'FMP' | 'CLS' | 'TBT' | 'SI' | 'TTI' | 'MPFID'> &
  Pick<typeof LighthouseScoreMetric, 'Performance' | 'Accessibility' | 'SEO' | 'BestPractices' | 'PWA'>

export type MetricKeyType = MetricUnion[keyof MetricUnion]

export type TimelineSchema = {
  data: string // image base64
  timestamp: number
  timing: number
}

export type UserTimingSchema = {
  name: string
  timestamp: number
  duration: number
}

export enum TimingType {
  FP = 'firstPaint',
  FCP = 'firstContentfulPaint',
  FMP = 'firstMeaningfulPaint',
  DCL = 'domContentLoaded',
  LCP = 'largestContentfulPaint',
  LOAD = 'load',
}

export enum LighthouseScoreType { // overview performance metrics
  FCP = 'first-contentful-paint', // ↓ from audits
  LCP = 'largest-contentful-paint',
  SI = 'speed-index',
  CLS = 'cumulative-layout-shift',
  TTI = 'interactive',
  TBT = 'total-blocking-time',
  TTFB = 'server-response-time',
  FMP = 'first-meaningful-paint',
  MPFID = 'max-potential-fid', // ↑ from audits
  JSParse = 'scriptParseCompile', // need calculation
  VC = 'visually-complete', // from render timelines
  LOAD = 'load', // from timings
  ResponseTime = 'response-time', // from timings
  WhiteScreen = 'white-screen',
  INP = 'interaction-to-next-paint',
}

export type MetricScoreSchema = {
  id: LighthouseScoreType
  title: string
  score?: number
  value?: number
  formatter: 'duration' | 'unitless' | 'default'
  unit?: string
}
