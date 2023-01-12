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
import { switchMap, map, endWith } from 'rxjs/operators'

import { GraphQLClient, createErrorCatcher } from '@perfsee/platform/common'
import {
  authorizedApplicationsQuery,
  AuthorizedApplicationsQuery,
  updateApplicationPermissionsMutation,
  getApplicationsQuery,
  GetApplicationsQuery,
  authorizeApplicationMutation,
  revokeApplicationPermissionsMutation,
  Permission,
} from '@perfsee/schema'

export type AuthApplication = AuthorizedApplicationsQuery['project']['authorizedApplications'][0]
export type Application = GetApplicationsQuery['applications']['edges'][0]['node']

interface State {
  authApps: AuthApplication[]
  applications: {
    totalCount: number
    items: Application[]
  }
  isAuthorizationSuccessful: boolean
}

@Module('AuthAppsModule')
export class AuthAppsModule extends EffectModule<State> {
  defaultState: State = {
    authApps: [],
    applications: {
      totalCount: 0,
      items: [],
    },
    isAuthorizationSuccessful: false,
  }

  constructor(private readonly client: GraphQLClient) {
    super()
  }

  @ImmerReducer()
  setAuthorizedApps(state: Draft<State>, apps: AuthApplication[]) {
    state.authApps = apps
  }

  @ImmerReducer()
  setAuthorizationSuccessful(state: Draft<State>, isAuthorizationSuccessful: boolean) {
    state.isAuthorizationSuccessful = isAuthorizationSuccessful
  }

  @ImmerReducer()
  setApplicationList(state: Draft<State>, apps: GetApplicationsQuery['applications']) {
    state.applications = {
      totalCount: apps.pageInfo.totalCount,
      items: apps.edges.map((edge) => edge.node),
    }
  }

  @Effect()
  getAuthorizedApps(payload$: Observable<string>) {
    return payload$.pipe(
      switchMap((projectId) =>
        this.client
          .query({
            query: authorizedApplicationsQuery,
            variables: {
              projectId,
            },
          })
          .pipe(
            createErrorCatcher('Failed to fetch project auth apps.'),
            map((data) => this.getActions().setAuthorizedApps(data.project.authorizedApplications)),
          ),
      ),
    )
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
  updateAuthAppPermission(payload$: Observable<{ projectId: string; appId: number; permissions: Permission[] }>) {
    return payload$.pipe(
      switchMap(({ projectId, appId, permissions }) =>
        this.client
          .mutate({
            mutation: updateApplicationPermissionsMutation,
            variables: {
              projectId,
              applicationId: appId,
              permissions,
            },
          })
          .pipe(
            createErrorCatcher('Failed to update auth app permission.'),
            map(() => this.getActions().getAuthorizedApps(projectId)),
          ),
      ),
    )
  }

  @Effect()
  authNewApplications(payload$: Observable<{ projectId: string; applicationId: number; permissions: Permission[] }>) {
    return payload$.pipe(
      switchMap(({ projectId, applicationId, permissions }) =>
        this.client
          .query({
            query: authorizeApplicationMutation,
            variables: {
              projectId,
              applicationId,
              permissions,
            },
          })
          .pipe(
            createErrorCatcher('Failed to auth new applications.'),
            map(() => this.getActions().getAuthorizedApps(projectId)),
            endWith(this.getActions().setAuthorizationSuccessful(true)),
          ),
      ),
    )
  }

  @Effect()
  deleteAuthApplication(payload$: Observable<{ projectId: string; appId: number }>) {
    return payload$.pipe(
      switchMap(({ projectId, appId }) =>
        this.client
          .mutate({
            mutation: revokeApplicationPermissionsMutation,
            variables: {
              projectId,
              applicationId: appId,
            },
          })
          .pipe(
            createErrorCatcher('Failed to auth new applications.'),
            map(() => this.getActions().getAuthorizedApps(projectId)),
          ),
      ),
    )
  }
}
