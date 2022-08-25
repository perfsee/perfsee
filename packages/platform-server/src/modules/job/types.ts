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

import { Field, ObjectType, InputType, GraphQLISODateTime, Int } from '@nestjs/graphql'
import GraphQLJSON from 'graphql-type-json'

import { JobType } from '@perfsee/server-common'
import { JobLog } from '@perfsee/shared'

@ObjectType()
export class JobAggregation {
  @Field(() => JobType)
  jobType!: JobType
  @Field()
  count!: number
}

@ObjectType()
class CategoryDateTimeUsage {
  @Field(() => JobType)
  jobType!: JobType

  @Field(() => GraphQLJSON)
  data!: Record</* day */ string, /* duration */ number>
}

@ObjectType()
export class TimeUsage {
  @Field({ description: 'The total time usage in ms' })
  total!: number

  @Field(() => [CategoryDateTimeUsage])
  detail!: CategoryDateTimeUsage[]
}

@InputType()
export class TimeUsageInput {
  @Field(() => GraphQLISODateTime, { description: 'The start of the time range' })
  from!: Date

  @Field(() => GraphQLISODateTime, { description: 'The end of the time range' })
  to!: Date
}

@ObjectType()
export class JobTrace {
  @Field()
  hasMore!: boolean

  @Field(() => GraphQLJSON)
  logs!: JobLog[]

  @Field(() => Int)
  endCursor!: number
}
