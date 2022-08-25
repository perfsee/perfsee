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

import { Audit, BundleAuditScore } from '../../types'

export const http2Notice: Audit = ({ chunks }) => {
  const initialAssets = new Set(
    chunks
      .filter((chunk) => !chunk.async)
      .map((chunk) => chunk.assets.map((asset) => asset.name))
      .flat(),
  )

  return {
    id: 'http2-notice',
    title: 'Use HTTP/2',
    desc: 'HTTP/2 offers many benefits over HTTP/1.1, including binary headers, multiplexing, and server push.',
    link: 'https://http2.github.io/faq/',
    score: initialAssets.size <= 6 ? BundleAuditScore.Good : BundleAuditScore.Notice,
    weight: 0,
  }
}
