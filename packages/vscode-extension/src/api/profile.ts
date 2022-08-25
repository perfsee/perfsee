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

import { FlameChartData } from '@perfsee/shared'

import { memoizePromise } from '../utils/cache'
import { getStorageLink } from '../utils/storage-link'

import { ApiClient } from './api-client'

export async function downloadProfile(client: ApiClient, flameChartStorageKey: string) {
  const res = await client.fetch(getStorageLink(flameChartStorageKey))
  return res.json() as Promise<FlameChartData>
}

export const memoizeDownloadProfile = memoizePromise(
  downloadProfile,
  (_, flameChartStorageKey) => flameChartStorageKey,
  false,
)
