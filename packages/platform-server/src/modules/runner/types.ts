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

import { Field, InputType, PartialType, PickType } from '@nestjs/graphql'

import { Runner } from '@perfsee/platform-server/db'
import { PaginationInput } from '@perfsee/platform-server/graphql'
import { JobType } from '@perfsee/server-common'

@InputType()
export class RunnerQueryFilter extends PaginationInput {
  @Field(() => JobType, { nullable: true, description: 'filter runners with specific job type' })
  jobType!: JobType | null

  @Field(() => String, { nullable: true, description: 'filter runners with zone' })
  zone!: string | null

  @Field(() => Boolean, { nullable: true, description: 'filter runners with status' })
  active!: boolean | null

  @Field(() => Boolean, { nullable: true, description: 'filter runners with online status' })
  online!: boolean | null
}

@InputType()
export class UpdateRunnerInput extends PartialType(PickType(Runner, ['name', 'jobType', 'active']), InputType) {}
