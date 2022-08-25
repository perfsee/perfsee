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

import { Injectable } from '@nestjs/common'

import { Project, User } from '@perfsee/platform-server/db'

import { Permission } from '../def'

@Injectable()
export class PermissionProvider {
  onCreateProject(_project: Project, _owners: User[], _creator: User): Promise<void> {
    throw new Error('unimplemented')
  }

  check(_user: User, _id: number | string, _permission: Permission): Promise<boolean> {
    throw new Error('unimplemented')
  }

  grant(_user: User, _projectId: number, _permission: Permission): Promise<void> {
    throw new Error('unimplemented')
  }

  revoke(_user: User, _projectId: number, _permission: Permission): Promise<void> {
    throw new Error('unimplemented')
  }

  /**
   * Get all accessible projects of given user
   */
  userAllowList(_user: User, _permission: Permission): Promise</* projectId[] */ number[]> {
    throw new Error('unimplemented')
  }

  /**
   * Get all users that have accessibility of given project
   */
  projectAllowList(
    _project: Project,
    _permission: Permission,
  ): Promise</* (userId | username)[] */ (number | string)[]> {
    throw new Error('unimplemented')
  }
}
