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

import { Field, GraphQLISODateTime, InputType, Int } from '@nestjs/graphql'

@InputType()
export class SnapshotReportFilter {
  @Field(() => [Int], {
    name: 'ids',
    nullable: true,
    description:
      'only return result with id in given snapshot report ids. If `ids` is set, all other filter options will be ignored',
  })
  iids!: number[] | null

  @Field(() => Int, { name: 'envId', nullable: true })
  envIid!: number | null

  @Field(() => Int, { name: 'profileId', nullable: true })
  profileIid!: number | null

  @Field(() => Int, { name: 'pageId', nullable: true })
  pageIid!: number | null

  @Field(() => GraphQLISODateTime, { nullable: true })
  from!: Date | null

  @Field(() => GraphQLISODateTime, { nullable: true })
  to!: Date | null

  @Field(() => Int, { nullable: true })
  length!: number | null

  @Field(() => Boolean, { nullable: true })
  withCompetitor!: boolean | null

  @Field(() => String, { nullable: true })
  hash!: string | null

  @Field(() => Boolean, { nullable: true })
  excludeCompetitor!: boolean | null

  @Field(() => Boolean, { nullable: true })
  excludeTemp!: boolean | null
}
