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

import { Audit } from '../../types'

import { compressionNotice } from './compression-notice'
import { duplicateLibs } from './duplicate-libs'
import { http2Notice } from './http2-notice'
import { largeAssets } from './large-assets'
import { largeLibs } from './large-libs'
import { missingSourceMap } from './missing-sourcemap'
import { mixedJs } from './mixed-js'
import { nonMinifiedAssets } from './non-minified-assets'
import { outRepoLibs } from './out-repo-libs'
import { preconnect } from './pre-connect'
import { unhealthyLibs } from './unhealthy-libs'

export const webAudits: Audit[] = [
  compressionNotice,
  duplicateLibs,
  http2Notice,
  largeAssets,
  largeLibs,
  mixedJs,
  nonMinifiedAssets,
  outRepoLibs,
  preconnect,
  unhealthyLibs,
  missingSourceMap,
]

export * from './cache-invalidation'
