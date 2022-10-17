import { Effect, EffectModule, ImmerReducer, Module } from '@sigi/core'
import { Draft } from 'immer'
import { map, Observable, switchMap } from 'rxjs'

import { createErrorCatcher, GraphQLClient } from '@perfsee/platform/common'
import { ProjectModule } from '@perfsee/platform/modules/shared'
import {
  updateProjectUserPermissionMutation,
  projectAuthedUsersQuery,
  ProjectAuthedUsersQuery,
  Permission,
} from '@perfsee/schema'

export type User = ProjectAuthedUsersQuery['project']['authorizedUsers'][0]

type State = {
  users: User[]
}

@Module('PermissionSettingsModule')
export class PermissionSettingsModule extends EffectModule<State> {
  readonly defaultState: State = {
    users: [],
  }

  constructor(private readonly client: GraphQLClient, private readonly project: ProjectModule) {
    super()
  }

  @Effect()
  getProjectAuthorizedUsers(payload$: Observable<void>) {
    return payload$.pipe(
      this.project.withProject,
      switchMap(([project]) =>
        this.client
          .mutate({
            mutation: projectAuthedUsersQuery,
            variables: {
              projectId: project.id,
            },
          })
          .pipe(
            createErrorCatcher('Failed to update project authorized users'),
            map((data) => this.getActions().setUsers(data.project.authorizedUsers)),
          ),
      ),
    )
  }

  @Effect()
  saveProjectOwners(payload$: Observable<{ email: string; permission: Permission; isAdd: boolean }>) {
    return payload$.pipe(
      this.project.withProject,
      switchMap(([project, { email, permission, isAdd }]) =>
        this.client
          .mutate({
            mutation: updateProjectUserPermissionMutation,
            variables: {
              projectId: project.id,
              email,
              permission,
              isAdd,
            },
          })
          .pipe(
            createErrorCatcher('Failed to update project owners'),
            map(() => this.getActions().getProjectAuthorizedUsers()),
          ),
      ),
    )
  }

  @ImmerReducer()
  setUsers(state: Draft<State>, users: User[]) {
    state.users = users
  }
}
