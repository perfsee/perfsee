import { Effect, EffectModule, ImmerReducer, Module } from '@sigi/core'
import { Draft } from 'immer'
import { differenceBy } from 'lodash'
import { map, Observable, switchMap } from 'rxjs'

import { createErrorCatcher, GraphQLClient } from '@perfsee/platform/common'
import { ProjectModule } from '@perfsee/platform/modules/shared'
import {
  updateProjectUserPermissionMutation,
  projectAuthedUsersQuery,
  ProjectAuthedUsersQuery,
  Permission,
} from '@perfsee/schema'

type Owner = ProjectAuthedUsersQuery['project']['owners'][0]
type Viewer = ProjectAuthedUsersQuery['project']['viewers'][0]

type State = {
  owners: Owner[]
  viewers: Viewer[]
}

@Module('PermissionSettingsModule')
export class PermissionSettingsModule extends EffectModule<State> {
  readonly defaultState: State = {
    owners: [],
    viewers: [],
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
            createErrorCatcher('Failed to update project owners'),
            map((data) => this.getActions().setUsers(data.project)),
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
  setUsers(state: Draft<State>, payload: ProjectAuthedUsersQuery['project']) {
    state.owners = payload.owners
    state.viewers = differenceBy(payload.viewers, payload.owners, 'email')
  }
}
