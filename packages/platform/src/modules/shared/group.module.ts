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

import { Module, EffectModule, Effect, ImmerReducer } from '@sigi/core'
import { Draft } from 'immer'
import { Observable } from 'rxjs'
import { map, switchMap, startWith, endWith, withLatestFrom, filter } from 'rxjs/operators'

import { GraphQLClient, createErrorCatcher } from '@perfsee/platform/common'
import {
  GroupQuery,
  groupQuery,
  GroupQueryVariables,
  deleteGroupMutation,
  updateGroupMutation,
  UpdateGroupMutationVariables,
  UpdateGroupMutation,
} from '@perfsee/schema'

import { DeleteProgress } from './property-type'

export type GroupInfo = GroupQuery['group']
export type ProjectInGroup = GroupQuery['group']['projects'][0]

interface State {
  group: GroupInfo | null
  loading: boolean
  deleteProgress: DeleteProgress
}

@Module('GroupModule')
export class GroupModule extends EffectModule<State> {
  defaultState = {
    loading: true,
    group: null,
    deleteProgress: DeleteProgress.None,
  }

  constructor(private readonly client: GraphQLClient) {
    super()
  }

  withGroup = <T>(input: Observable<T>) => {
    return input.pipe(
      withLatestFrom(this.state$),
      filter(([, { group }]) => !!group),
      map(([data, { group }]) => [group!, data] as const),
    )
  }

  @Effect()
  getGroup(payload$: Observable<GroupQueryVariables>) {
    return payload$.pipe(
      switchMap((payload) =>
        this.client
          .query({
            query: groupQuery,
            variables: payload,
          })
          .pipe(
            createErrorCatcher('Failed to get group information.'),
            map((data) => this.getActions().setGroup(data.group)),
            endWith(this.getActions().setLoading(false)),
            startWith(this.getActions().setLoading(true)),
          ),
      ),
    )
  }

  @Effect()
  deleteGroup(payload$: Observable<string>) {
    return payload$.pipe(
      switchMap((groupId) =>
        this.client
          .mutate({
            mutation: deleteGroupMutation,
            variables: { groupId },
          })
          .pipe(
            createErrorCatcher('Failed to delete group.'),
            map(() => this.getActions().setDeleted(DeleteProgress.Done)),
            startWith(this.getActions().setDeleted(DeleteProgress.Running)),
          ),
      ),
    )
  }

  @Effect()
  updateGroup(payload$: Observable<UpdateGroupMutationVariables>) {
    return payload$.pipe(
      switchMap((payload) =>
        this.client
          .mutate({
            mutation: updateGroupMutation,
            variables: payload,
          })
          .pipe(
            createErrorCatcher('Failed to update group.'),
            map((data) =>
              this.getActions().updateGroupProjects({ project: data.updateGroupProject, isAdd: payload.isAdd }),
            ),
          ),
      ),
    )
  }

  @ImmerReducer()
  setGroup(state: Draft<State>, group: GroupInfo | null) {
    state.group = group
  }

  @ImmerReducer()
  updateGroupProjects(
    state: Draft<State>,
    payload: { project: UpdateGroupMutation['updateGroupProject']; isAdd: boolean },
  ) {
    if (state.group) {
      const projects = state.group.projects.filter((p) => p.id !== payload.project.id)
      state.group = { ...state.group, projects: payload.isAdd ? [...projects, payload.project] : projects }
    }
  }

  @ImmerReducer()
  setLoading(state: Draft<State>, loading: boolean) {
    state.loading = loading
  }

  @ImmerReducer()
  setDeleted(state: Draft<State>, status: DeleteProgress) {
    state.deleteProgress = status
  }
}
