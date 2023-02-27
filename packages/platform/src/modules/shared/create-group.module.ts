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
import { switchMap, endWith, startWith, map, debounceTime } from 'rxjs/operators'

import { GraphQLClient, createErrorCatcher } from '@perfsee/platform/common'
import {
  CreateGroupMutationVariables,
  CreateGroupMutation,
  createGroupMutation,
  VerifyGroupIdQuery,
  verifyGroupIdQuery,
  ProjectsQuery,
  projectsQuery,
} from '@perfsee/schema'

export type CreatedGroup = CreateGroupMutation['createGroup']
type OrgIdVerification = VerifyGroupIdQuery['verifyGroupId']
type ProjectNode = ProjectsQuery['projects']['edges'][0]['node']

interface State {
  loading: boolean
  projects: ProjectNode[]
  creating: boolean
  createdGroup: CreatedGroup | null
  idVerifying: boolean
  idVerification: OrgIdVerification | null
}

@Module('ImportGroupModule')
export class CreateGroupModule extends EffectModule<State> {
  defaultState = {
    loading: true,
    creating: false,
    projects: [],
    createdGroup: null,
    idVerifying: false,
    idVerification: null,
  }

  constructor(private readonly client: GraphQLClient) {
    super()
  }

  @Effect()
  createGroup(payload$: Observable<CreateGroupMutationVariables['input']>) {
    return payload$.pipe(
      switchMap((input) =>
        this.client
          .mutate({
            mutation: createGroupMutation,
            variables: { input },
          })
          .pipe(
            createErrorCatcher('Failed to create group'),
            map((data) => {
              return this.getActions().setCreatedGroup(data.createGroup)
            }),
            startWith(this.getActions().setCreating(true)),
            endWith(this.getActions().setCreating(false)),
          ),
      ),
    )
  }

  @Effect()
  getProjects(payload$: Observable<{ query: string }>) {
    return payload$.pipe(
      switchMap(({ query }) =>
        this.client
          .query({
            query: projectsQuery,
            variables: { input: { skip: 0, first: 15 }, starred: false, query },
          })
          .pipe(
            createErrorCatcher('Failed to get projects list.'),
            map((data) => this.getActions().setProjects(data.projects)),
            startWith(this.getActions().setLoading(true)),
            endWith(this.getActions().setLoading(false)),
          ),
      ),
    )
  }

  @Effect()
  verifyId(payload$: Observable<string>) {
    return payload$.pipe(
      debounceTime(300),
      switchMap((input) =>
        this.client
          .mutate({
            mutation: verifyGroupIdQuery,
            variables: { id: input },
          })
          .pipe(
            map((data) => {
              return this.getActions().setIdVerification(data.verifyGroupId)
            }),
            createErrorCatcher('Error verifying id'),
            startWith(this.getActions().setVerifying(true)),
            endWith(this.getActions().setVerifying(false)),
          ),
      ),
    )
  }

  @ImmerReducer()
  setCreating(state: Draft<State>, payload: boolean) {
    state.creating = payload
  }

  @ImmerReducer()
  setVerifying(state: Draft<State>, verifying: boolean) {
    state.idVerifying = verifying
  }

  @ImmerReducer()
  setCreatedGroup(state: Draft<State>, payload: CreatedGroup) {
    state.createdGroup = payload
  }

  @ImmerReducer()
  setIdVerification(state: Draft<State>, payload: OrgIdVerification) {
    state.idVerification = payload
  }

  @ImmerReducer()
  setProjects(state: Draft<State>, { edges }: ProjectsQuery['projects']) {
    state.projects = edges.map((edge) => edge.node)
  }

  @ImmerReducer()
  setLoading(state: Draft<State>, loading: boolean) {
    state.loading = loading
  }
}
