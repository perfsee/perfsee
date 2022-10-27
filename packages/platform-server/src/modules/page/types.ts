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

import { Int, InputType, Field, ObjectType, PartialType, OmitType } from '@nestjs/graphql'

import { Page } from '@perfsee/platform-server/db'

@InputType()
export class CreatePageInput extends PartialType(OmitType(Page, ['projectId', 'id', 'iid'], InputType)) {
  @Field(() => [Int], { name: 'profileIds', description: 'page related profile ids' })
  profileIids!: number[]

  @Field(() => [Int], { name: 'envIds', description: 'page related environment ids' })
  envIids!: number[]

  @Field(() => [Int], { name: 'competitorIds', description: 'page related competitor page ids' })
  competitorIids!: number[]

  @Field(() => Int, {
    name: 'connectPageId',
    nullable: true,
    description:
      'used to automatically connect competitor page to existing page. only available when `isCompetitor` set `true`',
  })
  connectPageIid?: number
}

@InputType()
export class UpdatePageInput extends PartialType(CreatePageInput) {
  @Field(() => Int, { name: 'id' })
  iid!: number
}

export type PageInput = CreatePageInput | UpdatePageInput

@ObjectType()
export class PageRelation {
  @Field(() => Int, { description: 'page id' })
  pageId!: number

  @Field(() => [Int], { description: 'related profile ids' })
  profileIds!: number[]

  @Field(() => [Int], { description: 'related environment ids' })
  envIds!: number[]

  @Field(() => [Int], { description: 'related competitor page ids' })
  competitorIds!: number[]
}

@ObjectType()
export class PingResult {
  @Field(() => String, { description: 'pageId-profileId-envId' })
  key!: string

  @Field(() => String, { nullable: true, description: 'ping status' })
  status!: string
}
