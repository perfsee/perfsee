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
  CreateOrganizationMutationVariables,
  CreateOrganizationMutation,
  createOrganizationMutation,
  VerifyOrganizationIdQuery,
  verifyOrganizationIdQuery,
} from '@perfsee/schema'

export type CreatedOrganization = CreateOrganizationMutation['createOrganization']
type OrgIdVerification = VerifyOrganizationIdQuery['verifyOrganizationId']

interface State {
  creating: boolean
  createdOrganization: CreatedOrganization | null
  idVerifying: boolean
  idVerification: OrgIdVerification | null
}

@Module('ImportOrganizationModule')
export class CreateOrganizationModule extends EffectModule<State> {
  defaultState = {
    creating: false,
    createdOrganization: null,
    idVerifying: false,
    idVerification: null,
  }

  constructor(private readonly client: GraphQLClient) {
    super()
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
  setCreatedOrganization(state: Draft<State>, payload: CreatedOrganization) {
    state.createdOrganization = payload
  }

  @ImmerReducer()
  setIdVerification(state: Draft<State>, payload: OrgIdVerification) {
    state.idVerification = payload
  }

  @Effect()
  createOrganization(payload$: Observable<CreateOrganizationMutationVariables['input']>) {
    return payload$.pipe(
      switchMap((input) =>
        this.client
          .mutate({
            mutation: createOrganizationMutation,
            variables: { input },
          })
          .pipe(
            createErrorCatcher('Failed to create organization'),
            map((data) => {
              return this.getActions().setCreatedOrganization(data.createOrganization)
            }),
            startWith(this.getActions().setCreating(true)),
            endWith(this.getActions().setCreating(false)),
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
            mutation: verifyOrganizationIdQuery,
            variables: { id: input },
          })
          .pipe(
            map((data) => {
              return this.getActions().setIdVerification(data.verifyOrganizationId)
            }),
            createErrorCatcher('Error verifying id'),
            startWith(this.getActions().setVerifying(true)),
            endWith(this.getActions().setVerifying(false)),
          ),
      ),
    )
  }
}
