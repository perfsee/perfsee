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

import { Injectable } from '@nestjs/common'

import { AppVersion, InternalIdUsage } from '@perfsee/platform-server/db'
import { InternalIdService } from '@perfsee/platform-server/helpers'
import { Metric } from '@perfsee/platform-server/metrics'
import { nDaysBefore } from '@perfsee/platform-server/utils'

@Injectable()
export class AppVersionService {
  constructor(private readonly metrics: Metric, private readonly internalId: InternalIdService) {}

  async recordVersion(input: Partial<AppVersion> & Pick<AppVersion, 'projectId' | 'hash'>) {
    const existedVersion = await AppVersion.findOneBy(
      input.version
        ? {
            projectId: input.projectId,
            hash: input.hash,
            version: input.version,
          }
        : { projectId: input.projectId, hash: input.hash },
    )

    if (existedVersion) {
      return AppVersion.merge(existedVersion, input).save()
    } else {
      return AppVersion.create({
        ...input,
        iid: await this.internalId.generate(input.projectId, InternalIdUsage.AppVersion),
      }).save()
    }
  }

  async exemptedRelease(projectId: number, commit: string, reason: string) {
    this.metrics.elapseRelease(1)
    await AppVersion.createQueryBuilder()
      .where('project_id = :projectId')
      .andWhere('hash = :hash')
      .setParameters({
        projectId,
        hash: commit,
      })
      .update({
        exempted: true,
        exemptedReason: reason,
      })
      .execute()
  }

  async getAppVersions(projectId: number, from?: Date, to?: Date, first?: number) {
    const query = AppVersion.createQueryBuilder('app')
      .where('app.project_id = :projectId', { projectId })
      .andWhere('snapshot_id IS NOT NULL')
      .orderBy('created_at', 'DESC')
    if (from && to) {
      query.andWhere('app.created_at between :from and :to', { from, to })
    }

    if (first) {
      query.take(first)
    }

    return query.getMany()
  }

  async recentBranches(projectId: number) {
    const latestUpdated = await AppVersion.createQueryBuilder()
      .where('project_id = :projectId', { projectId })
      .andWhere('branch IS NOT NULL')
      .orderBy('created_at', 'DESC')
      .getOne()

    if (!latestUpdated) {
      return []
    }

    const rawData = await AppVersion.createQueryBuilder()
      .select('distinct branch as branch')
      .where('project_id = :projectId', { projectId })
      .andWhere('created_at > :createdAt', { createdAt: nDaysBefore(30, latestUpdated.createdAt) })
      .andWhere('branch is not null')
      .getRawMany<{ branch: string }>()

    return rawData.map(({ branch }) => branch)
  }
}
