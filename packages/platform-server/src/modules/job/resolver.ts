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

import { NotFoundException } from '@nestjs/common'
import { Args, Int, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql'
import dayjs from 'dayjs'
import { groupBy, sumBy } from 'lodash'

import { Job, Project, Runner } from '@perfsee/platform-server/db'
import { UserError } from '@perfsee/platform-server/error'
import { JobType } from '@perfsee/server-common'

import { getJobTypeConcurrency, JobService } from './service'
import { JobAggregation, JobTrace, TimeUsage, TimeUsageInput } from './types'

@Resolver(() => Runner)
export class RunnerJobResolver {
  constructor(private readonly service: JobService) {}

  @ResolveField(() => [Job])
  async runningJobs(@Parent() runner: Runner) {
    return this.service.getRunnerRunningJobs(runner)
  }

  @ResolveField(() => Number)
  async runningJobCount(@Parent() runner: Runner) {
    return this.service.getRunnerRunningJobsCount(runner)
  }

  @ResolveField(() => Number)
  maxJobConcurrency(@Parent() runner: Runner) {
    return getJobTypeConcurrency(runner.jobType)
  }
}

@Resolver(() => Project)
export class ProjectJobResolver {
  constructor(private readonly service: JobService) {}

  @ResolveField(() => Job)
  async job(
    @Parent() project: Project,
    @Args('jobType', { type: () => JobType }) jobType: JobType,
    @Args('entityId', { type: () => Int, nullable: true }) entityId: number,
    @Args('jobId', { type: () => Int, nullable: true }) jobId: number,
  ) {
    const job = jobId
      ? await this.service.getJobByIid(project.id, jobId)
      : await this.service.getJobByEntityId(jobType, entityId, project.id)
    if (!job) {
      throw new NotFoundException('Job not found')
    }

    return job
  }

  @ResolveField(() => [Job])
  async jobs(
    @Parent() project: Project,
    @Args('jobType', { type: () => JobType }) jobType: JobType,
    @Args('entityId', { type: () => Int }) entityId: number,
  ) {
    const jobs = await this.service.getJobsByEntityId(jobType, entityId, project.id)
    if (!jobs) {
      throw new NotFoundException('Jobs not found')
    }

    return jobs
  }

  @ResolveField(() => TimeUsage, { name: 'timeUsage', description: 'time usage information of project' })
  async projectTimeUsage(@Parent() project: Project, @Args('input') input: TimeUsageInput): Promise<TimeUsage> {
    if (input.from >= input.to) {
      throw new UserError('time usage query requires input.from to be less then input.to')
    }
    const jobs = await this.service.filterJobsByEndTime(project.id, input)
    const total = sumBy(jobs, 'duration')
    const typeGrouped = groupBy(jobs, 'jobType')

    const detail = Object.entries(typeGrouped).map(([jobType, jobs]) => {
      const dayGrouped = groupBy(jobs, (job) => dayjs(job.endedAt).startOf('day').toISOString())

      return {
        jobType: jobType as JobType,
        data: Object.entries(dayGrouped).reduce((data, [day, jobs]) => {
          data[day] = sumBy(jobs, 'duration')
          return data
        }, {}),
      }
    })

    return {
      total,
      detail,
    }
  }
}

@Resolver(() => Job)
export class JobResolver {
  constructor(private readonly service: JobService) {}

  @Query(() => [JobAggregation])
  async pendingJobsAggregation() {
    return this.service.getPendingJobsCount()
  }

  @ResolveField(() => JobTrace)
  async trace(
    @Parent() job: Job,
    @Args('after', { nullable: true, defaultValue: -1 }) after: number,
  ): Promise<JobTrace> {
    const logs = await this.service.getJobLog(job, after)

    return {
      logs,
      hasMore: !job.endedAt,
      endCursor: after + logs.length,
    }
  }
}
