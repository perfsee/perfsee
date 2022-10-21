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

import { Field, InputType, ObjectType, PartialType, PickType } from '@nestjs/graphql'

import { User } from '@perfsee/platform-server/db'
import { GitHost, Permission } from '@perfsee/shared'

@InputType()
export class CreateProjectInput {
  @Field(() => GitHost)
  host!: GitHost

  @Field(() => String)
  namespace!: string

  @Field(() => String)
  name!: string

  @Field(() => String)
  id!: string

  @Field(() => String)
  artifactBaselineBranch!: string
}

@InputType()
export class UpdateProjectInput extends PartialType(PickType(CreateProjectInput, ['artifactBaselineBranch'])) {
  @Field(() => Boolean, { description: 'project visibility', nullable: true })
  isPublic?: boolean
}

@ObjectType()
export class UserWithPermission extends User {
  @Field(() => Permission, { description: 'user permission of project' })
  permission?: Permission
}
