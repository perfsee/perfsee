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

import { Args, PickType, InputType, Mutation, PartialType, Query } from '@nestjs/graphql'

import { RunnerScript } from '@perfsee/platform-server/db'
import { JobType } from '@perfsee/server-common'

import { Auth } from '../auth'

import { RunnerScriptService } from './service'

@InputType()
export class UpdateRunnerScriptInput extends PartialType(PickType(RunnerScript, ['enable']), InputType) {}

@Auth()
export class RunnerScriptResolver {
  constructor(private readonly service: RunnerScriptService) {}

  @Query(() => [RunnerScript], { name: 'runnerScripts' })
  getRunnerScripts(@Args({ type: () => String, name: 'jobType' }) jobType: string): Promise<RunnerScript[]> {
    return this.service.getRunnerScripts(JobType[jobType] || jobType)
  }

  @Query(() => [RunnerScript], { name: 'extensionScripts' })
  getExtensionScripts(@Args({ type: () => String, name: 'jobType' }) jobType: string): Promise<RunnerScript[]> {
    return this.service.getExtensionScripts(jobType)
  }

  @Query(() => RunnerScript, { name: 'activatedRunnerScripts', nullable: true })
  getActivatedRunnerScript(
    @Args({ type: () => String, name: 'jobType' }) jobType: string,
  ): Promise<RunnerScript | null> {
    return this.service.getActivated(JobType[jobType] || jobType)
  }

  @Auth('admin')
  @Mutation(() => RunnerScript)
  async updateRunnerScript(
    @Args({ type: () => String, name: 'jobType' }) jobType: string,
    @Args({ type: () => String, name: 'version' }) version: string,
    @Args({ type: () => UpdateRunnerScriptInput, name: 'input' }) input: UpdateRunnerScriptInput,
  ) {
    return this.service.updateRunnerScripts(JobType[jobType] || jobType, version, input)
  }
}
