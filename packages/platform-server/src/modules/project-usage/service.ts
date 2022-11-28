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

import { DBService, Project, ProjectJobUsage, ProjectStorageUsage, UsagePack } from '@perfsee/platform-server/db'
import { Logger } from '@perfsee/platform-server/logger'

import { ProjectService } from '../project/service'

@Injectable()
export class ProjectUsageService {
  constructor(
    private readonly db: DBService,
    private readonly project: ProjectService,
    private readonly logger: Logger,
  ) {}

  async verifyUsageLimit(projectId: number) {
    const project = await this.project.loader.load(projectId)

    if (!project) {
      throw new Error(`No such project by id ${projectId}`)
    }

    const usage = await this.getProjectUsage(project)
    const limit = await this.getProjectUsageLimit(project)

    if (!limit) {
      throw new Error('Project has no usage pack.')
    }

    if (limit.jobCountMonthly !== -1 && usage.jobCount >= limit.jobCountMonthly) {
      throw new Error('Project job count usage in this month has exceeded.')
    }

    if (limit.jobDurationMonthly !== -1 && parseFloat(usage.jobDuration) >= limit.jobDurationMonthly) {
      throw new Error('Project job duration time in this month has exceeded.')
    }

    if (limit.storage !== -1 && parseFloat(usage.storage) >= limit.storage) {
      throw new Error('Project storage size has exceeded.')
    }

    return true
  }

  async getProjectUsage(project: Project) {
    const [year, month] = this.getDate()

    const jobUsage = await ProjectJobUsage.findOneBy({ projectId: project.id, year, month })
    const storageUsage = await ProjectStorageUsage.findOneBy({ projectId: project.id })

    return {
      jobCount: jobUsage?.jobCount ?? 0,
      jobDuration: jobUsage?.jobDuration ?? '0',
      storage: storageUsage?.used ?? '0',
    }
  }

  getProjectUsageLimit(project: Project) {
    if (project.usagePackId) {
      return UsagePack.findOneByOrFail({ id: project.usagePackId })
    }

    return UsagePack.findOneByOrFail({ isDefault: true })
  }

  async recordStorageUsage(projectId: number, storageInBytes: number) {
    const storage = storageInBytes / 1000 / 1000
    await this.db.transaction(async (manager) => {
      const usage = await manager.findOneBy(ProjectStorageUsage, { projectId })
      if (!usage) {
        if (storage > 0) {
          await manager.insert(ProjectStorageUsage, {
            projectId,
            used: String(storage),
          })
        }
      } else {
        await manager.update(
          ProjectStorageUsage,
          { id: usage.id },
          {
            used: () => `GREATEST(used ${storage < 0 ? '' : '+'} ${storage}, 0)`,
          },
        )
      }
    })

    this.logger.verbose(`Record storage usage ${storage} MB to project ${projectId}`)
  }

  async recordJobCountUsage(projectId: number, count: number) {
    const [year, month] = this.getDate()
    await this.db.transaction(async (manager) => {
      const usage = await manager.findOneBy(ProjectJobUsage, { projectId, year, month })
      if (!usage) {
        await manager.insert(ProjectJobUsage, {
          projectId,
          year,
          month,
          jobCount: count,
        })
      } else {
        await manager.update(
          ProjectJobUsage,
          { id: usage.id },
          {
            jobCount: () => `job_count + ${count}`,
          },
        )
      }
    })

    this.logger.verbose(`Record job count usage ${count} to project ${projectId}`)
  }

  async recordJobDurationUsage(projectId: number, durationInMs: number) {
    const [year, month] = this.getDate()
    const durationInMin = (durationInMs / 1000 / 60).toFixed(2)
    await this.db.transaction(async (manager) => {
      const usage = await manager.findOneBy(ProjectJobUsage, { projectId, year, month })
      if (!usage) {
        await manager.insert(ProjectJobUsage, {
          projectId,
          year,
          month,
          jobDuration: durationInMin,
        })
      } else {
        await manager.update(
          ProjectJobUsage,
          { id: usage.id },
          {
            jobDuration: () => `job_duration + ${durationInMin}`,
          },
        )
      }
    })

    this.logger.verbose(`Record job duration usage ${durationInMin} min to project ${projectId}`)
  }

  private getDate() {
    const date = new Date()
    return [date.getFullYear(), date.getMonth() + 1]
  }
}
