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
  ProjectQuery,
  projectQuery,
  ProjectQueryVariables,
  updateProjectMutation,
  UpdateProjectMutationVariables,
  deleteProjectMutation,
} from '@perfsee/schema'

import { DeleteProgress } from './property-type'

export type ProjectInfo = ProjectQuery['project']

interface State {
  project: ProjectInfo | null
  loading: boolean
  deleteProgress: DeleteProgress
}

@Module('ProjectModule')
export class ProjectModule extends EffectModule<State> {
  defaultState = {
    loading: true,
    deleteProgress: DeleteProgress.None,
    project: null,
  }

  constructor(private readonly client: GraphQLClient) {
    super()
  }

  withProject = <T>(input: Observable<T>) => {
    return input.pipe(
      withLatestFrom(this.state$),
      filter(([, { project }]) => !!project),
      map(([data, { project }]) => [project!, data] as const),
    )
  }

  @Effect()
  getProject(payload$: Observable<ProjectQueryVariables>) {
    return payload$.pipe(
      switchMap((payload) =>
        this.client
          .query({
            query: projectQuery,
            variables: payload,
          })
          .pipe(
            createErrorCatcher('Failed to get project information.'),
            map((data) => this.getActions().setProject(data.project)),
            endWith(this.getActions().setLoading(false)),
            startWith(this.getActions().setLoading(true)),
          ),
      ),
    )
  }

  @Effect()
  updateProject(
    payload$: Observable<{ projectId: string; input: Partial<UpdateProjectMutationVariables['projectInput']> }>,
  ) {
    return payload$.pipe(
      switchMap(({ projectId, input }) =>
        this.client
          .mutate({
            mutation: updateProjectMutation,
            variables: {
              projectId: projectId,
              projectInput: input,
            },
          })
          .pipe(
            createErrorCatcher('Failed to update project.'),
            map(({ updateProject }) => this.getActions().setProject(updateProject)),
          ),
      ),
    )
  }

  @Effect()
  deleteProject(payload$: Observable<string>) {
    return payload$.pipe(
      switchMap((projectId) =>
        this.client
          .mutate({
            mutation: deleteProjectMutation,
            variables: { projectId },
          })
          .pipe(
            createErrorCatcher('Failed to delete project.'),
            map(() => this.getActions().setDeleted(DeleteProgress.Done)),
            startWith(this.getActions().setDeleted(DeleteProgress.Running)),
          ),
      ),
    )
  }

  @ImmerReducer()
  setProject(state: Draft<State>, project: ProjectInfo | null) {
    state.project = project
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
