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
import { Observable, of } from 'rxjs'
import { map, switchMap, mergeMap } from 'rxjs/operators'

import { GraphQLClient, createErrorCatcher } from '@perfsee/platform/common'
import {
  GetApplicationsQuery,
  getApplicationsQuery,
  authorizedProjectsQuery,
  AuthorizedProjectsQuery,
  createApplicationMutation,
} from '@perfsee/schema'

export type Application = GetApplicationsQuery['applications']['edges'][0]['node']
export type AuthProject = AuthorizedProjectsQuery['application']['authorizedProjects'][0]

interface State {
  applications: {
    totalCount: number
    items: Application[]
  }
  authProjects: AuthProject[]
  appToken: string | null
}

@Module('ApplicationsModule')
export class ApplicationsModule extends EffectModule<State> {
  readonly defaultState: State = {
    applications: {
      totalCount: 0,
      items: [],
    },
    authProjects: [],
    appToken: null,
  }

  constructor(private readonly client: GraphQLClient) {
    super()
  }

  @ImmerReducer()
  setApplicationList(state: Draft<State>, apps: GetApplicationsQuery['applications']) {
    state.applications = {
      totalCount: apps.pageInfo.totalCount,
      items: apps.edges.map((edge) => edge.node),
    }
  }

  @ImmerReducer()
  pushApplication(state: Draft<State>, app: Application) {
    state.applications.items.unshift(app)
  }

  @ImmerReducer()
  setProjects(state: Draft<State>, payload: AuthProject[]) {
    state.authProjects = payload
  }

  @ImmerReducer()
  setAppToken(state: Draft<State>, payload: string | null) {
    state.appToken = payload
  }

  @Effect()
  getApplications(payload$: Observable<{ first: number; skip: number }>) {
    return payload$.pipe(
      switchMap(({ first, skip }) =>
        this.client
          .query({
            query: getApplicationsQuery,
            variables: {
              pagination: {
                first,
                skip,
              },
            },
          })
          .pipe(
            createErrorCatcher('Failed to fetch applications.'),
            map((data) => this.getActions().setApplicationList(data.applications)),
          ),
      ),
    )
  }

  @Effect()
  getAppAuthProjects(payload$: Observable<number>) {
    return payload$.pipe(
      switchMap((appId) =>
        this.client
          .query({
            query: authorizedProjectsQuery,
            variables: {
              appId,
            },
          })
          .pipe(
            createErrorCatcher('Failed to fetch applications.'),
            map((data) => this.getActions().setProjects(data.application.authorizedProjects)),
          ),
      ),
    )
  }

  @Effect()
  createApplication(payload$: Observable<{ name: string }>) {
    return payload$.pipe(
      switchMap(({ name }) =>
        this.client
          .query({
            query: createApplicationMutation,
            variables: {
              name,
            },
          })
          .pipe(
            createErrorCatcher('Failed to fetch applications.'),
            mergeMap((data) =>
              of(
                this.getActions().setAppToken(data.createApplication.token),
                this.getActions().pushApplication(data.createApplication.application),
              ),
            ),
          ),
      ),
    )
  }
}
