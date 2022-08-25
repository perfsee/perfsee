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

import { Field, ID, ObjectType } from '@nestjs/graphql'

import { Application } from '@perfsee/platform-server/db'
import { GitHost } from '@perfsee/shared'

import { Permission } from '../permission'

@ObjectType()
export class CreateApplicationResult {
  @Field(() => Application)
  application!: Application

  @Field()
  token!: string
}

@ObjectType()
export class ApplicationProject {
  @Field(() => ID, { description: 'project id' })
  id!: string

  @Field({ description: 'repository namespace' })
  namespace!: string

  @Field({ description: 'repository name' })
  name!: string

  @Field(() => GitHost, { description: 'repository host' })
  host!: GitHost
}

@ObjectType()
export class ProjectAuthorizedApplicationsNode {
  @Field(() => Application)
  app!: Application

  @Field(() => [Permission])
  permissions!: Permission[]
}

@ObjectType()
export class ApplicationAuthorizedProjectsNode {
  @Field(() => ApplicationProject)
  project!: ApplicationProject

  @Field(() => [Permission])
  permissions!: Permission[]
}
