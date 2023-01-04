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
import { map, switchMap, startWith, endWith } from 'rxjs/operators'

import { GraphQLClient, createErrorCatcher } from '@perfsee/platform/common'
import {
  OrganizationQuery,
  organizationQuery,
  OrganizationQueryVariables,
  updateOrganizationMutation,
  UpdateOrganizationMutationVariables,
  organizationUsageQuery,
  OrganizationUsageQueryVariables,
  OrganizationUsageQuery,
} from '@perfsee/schema'

export type OrganizationInfo = OrganizationQuery['organization']
export type OrganizationUsageInfo = OrganizationUsageQuery['organizationUsage']

interface State {
  organization: OrganizationInfo | null
  organizationUsage: OrganizationUsageInfo
  loading: boolean
  usageLoading: boolean
  projectMap: Map<string /**project id */, any>
}

@Module('OrganizationModule')
export class OrganizationModule extends EffectModule<State> {
  defaultState = {
    loading: true,
    usageLoading: true,
    organization: null,
    projectMap: new Map(),
    organizationUsage: [],
  }

  constructor(private readonly client: GraphQLClient) {
    super()
  }

  @Effect()
  getOrganization(payload$: Observable<OrganizationQueryVariables>) {
    return payload$.pipe(
      switchMap((payload) =>
        this.client
          .query({
            query: organizationQuery,
            variables: payload,
          })
          .pipe(
            createErrorCatcher('Failed to get organization information.'),
            map((data) => this.getActions().setOrganization(data.organization)),
            endWith(this.getActions().setLoading(false)),
            startWith(this.getActions().setLoading(true)),
          ),
      ),
    )
  }

  @Effect()
  getOrganizationUsage(payload$: Observable<OrganizationUsageQueryVariables>) {
    return payload$.pipe(
      switchMap((payload) =>
        this.client
          .query({
            query: organizationUsageQuery,
            variables: payload,
          })
          .pipe(
            createErrorCatcher('Failed to get organization usage.'),
            map((data) => this.getActions().setOrganizationUsage(data.organizationUsage)),
            endWith(this.getActions().setUsageLoading(false)),
            startWith(this.getActions().setUsageLoading(true)),
          ),
      ),
    )
  }

  @Effect()
  updateOrganization(
    payload$: Observable<{
      organizationId: string
      input: Partial<UpdateOrganizationMutationVariables['organizationInput']>
    }>,
  ) {
    return payload$.pipe(
      switchMap(({ organizationId, input }) =>
        this.client
          .mutate({
            mutation: updateOrganizationMutation,
            variables: {
              organizationId: organizationId,
              organizationInput: input,
            },
          })
          .pipe(
            createErrorCatcher('Failed to update organization.'),
            map(({ updateOrganization }) => this.getActions().setOrganization(updateOrganization)),
          ),
      ),
    )
  }

  @ImmerReducer()
  setOrganization(state: Draft<State>, organization: OrganizationInfo | null) {
    state.organization = organization
  }

  @ImmerReducer()
  setOrganizationUsage(state: Draft<State>, payload: OrganizationUsageQuery['organizationUsage']) {
    state.organizationUsage = payload
  }

  @ImmerReducer()
  setLoading(state: Draft<State>, loading: boolean) {
    state.loading = loading
  }

  @ImmerReducer()
  setUsageLoading(state: Draft<State>, loading: boolean) {
    state.usageLoading = loading
  }
}
