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

import { InputType, OmitType, PartialType, ObjectType, Field, Int } from '@nestjs/graphql'

import { Profile } from '@perfsee/platform-server/db'

@ObjectType()
export class ConnectionType {
  @Field()
  id!: string

  @Field()
  title!: string

  @Field(() => Int)
  download!: number

  @Field(() => Int)
  upload!: number

  @Field(() => Int)
  latency!: number

  @Field(() => Int)
  rtt!: number
}

@ObjectType()
export class DeviceType {
  @Field()
  id!: string

  @Field()
  value!: string
}

@InputType()
export class UpdateProfileInput extends PartialType(OmitType(Profile, ['projectId', 'id']), InputType) {}
