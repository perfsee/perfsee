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

import { Resolver, ResolveField, Parent } from '@nestjs/graphql'

import { Project, UsagePack } from '@perfsee/platform-server/db'

import { ProjectUsageService } from './service'
import { ProjectUsage } from './types'

@Resolver(() => Project)
export class ProjectProjectUsageResolver {
  constructor(private readonly service: ProjectUsageService) {}

  @ResolveField(() => ProjectUsage, { name: 'usage', description: 'project usage' })
  async usage(@Parent() project: Project): Promise<ProjectUsage> {
    const usage = await this.service.getProjectUsage(project)
    return {
      storage: parseFloat(usage.storage),
      jobCount: usage.jobCount,
      jobDuration: parseFloat(usage.jobDuration),
    }
  }

  @ResolveField(() => UsagePack, { name: 'usagePack', description: 'project usage pack' })
  usagePack(@Parent() project: Project): Promise<UsagePack> {
    return this.service.getProjectUsageLimit(project)
  }
}
