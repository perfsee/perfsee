/*
Copyright 2022 ByteDance and/or its affiliates.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.group/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import { Effect, EffectModule, ImmerReducer, Module } from '@sigi/core'
import { Draft } from 'immer'
import { map, Observable, switchMap } from 'rxjs'

import { createErrorCatcher, GraphQLClient } from '@perfsee/platform/common'
import {
  updateGroupUserPermissionMutation,
  groupAuthedUsersQuery,
  GroupAuthedUsersQuery,
  Permission,
} from '@perfsee/schema'

import { GroupModule } from '../../shared/group.module'

export type User = GroupAuthedUsersQuery['group']['authorizedUsers'][0]

type State = {
  users: User[]
}

@Module('GroupPermissionSettingsModule')
export class GroupPermissionSettingsModule extends EffectModule<State> {
  readonly defaultState: State = {
    users: [],
  }

  constructor(private readonly client: GraphQLClient, private readonly group: GroupModule) {
    super()
  }

  @Effect()
  getGroupAuthorizedUsers(payload$: Observable<string>) {
    return payload$.pipe(
      switchMap((payload) =>
        this.client
          .mutate({
            mutation: groupAuthedUsersQuery,
            variables: {
              groupId: payload,
            },
          })
          .pipe(
            createErrorCatcher('Failed to update group authorized users'),
            map((data) => this.getActions().setUsers(data.group.authorizedUsers)),
          ),
      ),
    )
  }

  @Effect()
  saveGroupOwners(payload$: Observable<{ email: string; permission: Permission; isAdd: boolean }>) {
    return payload$.pipe(
      this.group.withGroup,
      switchMap(([group, { email, permission, isAdd }]) =>
        this.client
          .mutate({
            mutation: updateGroupUserPermissionMutation,
            variables: {
              groupId: group.id,
              email,
              permission,
              isAdd,
            },
          })
          .pipe(
            createErrorCatcher('Failed to update group owners'),
            map(() => this.getActions().getGroupAuthorizedUsers(group.id)),
          ),
      ),
    )
  }

  @ImmerReducer()
  setUsers(state: Draft<State>, users: User[]) {
    state.users = users
  }
}
