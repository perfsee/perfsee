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

import { Link } from '@fluentui/react'

export const cardGroups: Record<string, { detail: JSX.Element }> = {
  'first-contentful-paint': {
    detail: (
      <p>
        First Contentful Paint marks the time at which the first text or image is painted.{' '}
        <Link href="https://developer.chrome.com/docs/lighthouse/performance/first-contentful-paint" target="_blank">
          Learn more about the First Contentful Paint metric.
        </Link>
      </p>
    ),
  },
  'largest-contentful-paint': {
    detail: (
      <p>
        Largest Contentful Paint marks the time at which the largest text or image is painted.{' '}
        <Link
          href="https://developer.chrome.com/docs/lighthouse/performance/lighthouse-largest-contentful-paint"
          target="_blank"
        >
          Learn more about the Largest Contentful Paint metric
        </Link>
      </p>
    ),
  },
  'speed-index': {
    detail: (
      <p>
        Speed Index shows how quickly the contents of a page are visibly populated.{' '}
        <Link href="https://developer.chrome.com/docs/lighthouse/performance/speed-index" target="_blank">
          Learn more about the Speed Index metric.
        </Link>
      </p>
    ),
  },
  'cumulative-layout-shift': {
    detail: (
      <p>
        Cumulative Layout Shift measures the movement of visible elements within the viewport.{' '}
        <Link
          href="Cumulative Layout Shift measures the movement of visible elements within the viewport."
          target="_blank"
        >
          Learn more about the Cumulative Layout Shift metric.
        </Link>
      </p>
    ),
  },
  'total-blocking-time': {
    detail: (
      <p>
        Sum of all time periods between FCP and Time to Interactive, when task length exceeded 50ms, expressed in
        milliseconds.{' '}
        <Link
          href="https://developer.chrome.com/docs/lighthouse/performance/lighthouse-total-blocking-time"
          target="_blank"
        >
          Learn more about the Total Blocking Time metric.
        </Link>
      </p>
    ),
  },
  interactive: {
    detail: (
      <p>
        Time to interactive is the amount of time it takes for the page to bacome fully interactive.{' '}
        <Link href="https://developer.chrome.com/docs/lighthouse/performance/interactive" target="_blank">
          Learn More.
        </Link>
      </p>
    ),
  },
  'first-meaningful-paint': {
    detail: (
      <p>
        First meaningful paint measures when the primary content of a page is visiable.{' '}
        <Link href="https://developer.chrome.com/docs/lighthouse/performance/first-meaningful-paint" target="_blank">
          Learn More.
        </Link>
      </p>
    ),
  },
  'max-potential-fid': {
    detail: (
      <p>
        The maximum potential First Input Delay that your users could experience is the duration, in milliseconds, of
        the longest task.{' '}
        <Link
          href="https://developer.chrome.com/docs/lighthouse/performance/lighthouse-max-potential-fid"
          target="_blank"
        >
          Learn More.
        </Link>
      </p>
    ),
  },
  'server-response-time': {
    detail: (
      <p>
        Time to first byte is a metric that measures the time between the request for a resource and when the first byte
        of a response begins to arrive.{' '}
        <Link href="https://web.dev/articles/ttfb" target="_blank">
          Learn More.
        </Link>
      </p>
    ),
  },
}
