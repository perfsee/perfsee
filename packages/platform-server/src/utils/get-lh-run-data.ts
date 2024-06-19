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

import { Page, Profile, SnapshotReport, Environment } from '@perfsee/platform-server/db'
import { E2EJobPayload, LabJobPayload, PingJobPayload } from '@perfsee/server-common'

import { Config } from '../config'
import { CONNECTIONS } from '../modules/profile/constants'

export const formatHeaders = (headers: Record<string, string | number>) => {
  const result: Record<string, string> = {}

  Object.keys(headers).forEach((key) => {
    result[key.toUpperCase()] = headers[key].toString()
  })

  return result
}

export function getLighthouseRunData(
  pages: Page[],
  profiles: Profile[],
  environments: Environment[],
  reports: SnapshotReport[],
  config: Config,
): (LabJobPayload | E2EJobPayload)[] {
  return reports.map((report) => {
    const profile = profiles.find((item) => item.id === report.profileId)!
    const page = pages.find((item) => item.id === report.pageId)!
    const env = environments.find((item) => item.id === report.envId)!

    const throttle = CONNECTIONS.find((item) => item.id === profile.bandWidth)
    const deviceId = profile.device

    const distributed = config.job.lab.distributedConfig?.[env.zone]

    return {
      reportId: report.id,
      url: page.url,
      throttle: throttle ?? {},
      deviceId,
      headers: env.headers,
      cookies: env.cookies,
      e2eScript: page.e2eScript,
      runs: process.env.NODE_ENV === 'development' ? 1 : distributed ? distributed.runs : 5,
      localStorage: env.localStorage ?? [],
      reactProfiling: profile.reactProfiling ?? false,
      enableProxy: profile.enableProxy ?? false,
      warmup: profile.warmup ?? false,
      loginScript: env.loginScript,
      userAgent: profile.userAgent,
    }
  })
}

export function getLabPingData(page: Page, profile: Profile, env: Environment): PingJobPayload {
  const deviceId = profile.device

  return {
    key: `${page.id}-${profile.id}-${env.id}`,
    url: page.url,
    deviceId,
    headers: env.headers,
    cookies: env.cookies,
  }
}
