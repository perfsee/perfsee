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

import { Module, EffectModule, Effect, ImmerReducer, DefineAction, Reducer } from '@sigi/core'
import { Draft } from 'immer'
import { isEqual } from 'lodash'
import { combineLatest, Observable, of } from 'rxjs'
import { distinctUntilChanged, endWith, map, mergeMap, startWith, switchMap } from 'rxjs/operators'

import { createErrorCatcher, GraphQLClient } from '@perfsee/platform/common'
import {
  updateRunnerMutation,
  runnerQuery,
  RunnerInfoFragment,
  RunnerQueryFilter,
  runnersQuery,
  RunnersQuery,
  runnerRunningJobsQuery,
  RunnerRunningJobsQuery,
  deleteRunnerMutation,
  UpdateRunnerInput,
} from '@perfsee/schema'

export type RunningJob = RunnerRunningJobsQuery['runner']['runningJobs'][0]
export type Runner = RunnerInfoFragment & {
  runningJobs?: RunningJob[]
}

export interface State {
  loading: boolean
  filter: Partial<RunnerQueryFilter>
  runnerCount: number
  runners: Runner[]
  registrationToken: string
}

@Module('Runners')
export class RunnersModule extends EffectModule<State> {
  defaultState: State = {
    loading: true,
    filter: { first: 50 },
    runnerCount: 0,
    runners: [],
    registrationToken: '',
  }

  @DefineAction() dispose$!: Observable<void>

  constructor(private readonly client: GraphQLClient) {
    super()
  }

  @Effect()
  fetchRunners(payload$: Observable<void>) {
    return combineLatest([
      payload$,
      this.state$.pipe(
        map((state) => state.filter),
        distinctUntilChanged(),
      ),
    ]).pipe(
      switchMap(([, filter]) =>
        this.client
          .query({
            query: runnersQuery,
            variables: {
              filter,
            },
          })
          .pipe(
            mergeMap((data) =>
              of(
                this.getActions().setRunners(data),
                this.getActions().setRegistrationToken(data.applicationSetting.registrationToken),
              ),
            ),
            createErrorCatcher('Failed to fetch runners'),
            startWith(this.getActions().setLoading(true)),
            endWith(this.getActions().setLoading(false)),
          ),
      ),
    )
  }

  @Effect()
  updateRunner(payload$: Observable<{ id: string } & Partial<UpdateRunnerInput>>) {
    return payload$.pipe(
      mergeMap(({ id, ...input }) =>
        this.client
          .mutate({
            mutation: updateRunnerMutation,
            variables: {
              id,
              input,
            },
          })
          .pipe(
            map((data) => this.getActions().setRunner(data.updateRunner)),
            createErrorCatcher('Failed to update runner'),
          ),
      ),
    )
  }

  @Effect()
  fetchRunner(payload$: Observable<string>) {
    return payload$.pipe(
      mergeMap((id) =>
        this.client
          .query({
            query: runnerQuery,
            variables: {
              id,
            },
          })
          .pipe(
            map((data) => this.getActions().setRunner(data.runner)),
            createErrorCatcher('Failed to fetch runner status.'),
          ),
      ),
    )
  }

  @Effect()
  fetchRunnerRunningJobs(payload$: Observable<string>) {
    return payload$.pipe(
      mergeMap((id) =>
        this.client
          .query({
            query: runnerRunningJobsQuery,
            variables: {
              id,
            },
          })
          .pipe(
            map((data) => this.getActions().setRunnerRunningJobs({ id, jobs: data.runner.runningJobs })),
            createErrorCatcher('Failed to fetch runner running jobs.'),
          ),
      ),
    )
  }

  @Effect()
  deleteRunner(payload$: Observable<string>) {
    return payload$.pipe(
      mergeMap((id) =>
        this.client
          .mutate({
            mutation: deleteRunnerMutation,
            variables: { id },
          })
          .pipe(
            map(() => this.getActions().removeRunnerFromList(id)),
            createErrorCatcher('Failed to delete runner'),
          ),
      ),
    )
  }

  @ImmerReducer()
  removeRunnerFromList(state: Draft<State>, id: string) {
    state.runners = state.runners.filter((runner) => id !== runner.id)
  }

  @ImmerReducer()
  setLoading(state: Draft<State>, loading: boolean) {
    state.loading = loading
  }

  @ImmerReducer()
  setRunner(state: Draft<State>, runner: Runner) {
    const index = state.runners.findIndex((r) => r.id === runner.id)
    if (index > -1) {
      state.runners[index] = runner
    }
  }

  @ImmerReducer()
  setRunnerRunningJobs(state: Draft<State>, { id, jobs }: { id: string; jobs: RunningJob[] }) {
    const runner = state.runners.find((r) => r.id === id)
    if (runner) {
      runner.runningJobs = jobs
    }
  }

  @ImmerReducer()
  setRunners(state: Draft<State>, { runners }: RunnersQuery) {
    state.runnerCount = runners.pageInfo.totalCount
    state.runners = runners.edges.map((edge) => edge.node).sort((a, b) => (a.online ? -1 : b.online ? 1 : -1))
  }

  @ImmerReducer()
  setRegistrationToken(state: Draft<State>, token: string) {
    state.registrationToken = token
  }

  @Reducer()
  setFilter(state: State, filter: Partial<RunnerQueryFilter>) {
    if (isEqual(state.filter, filter)) {
      return state
    }

    return {
      ...state,
      filter: {
        ...state.filter,
        ...filter,
      },
    }
  }

  @ImmerReducer()
  clearFilter(state: Draft<State>) {
    state.filter = {}
  }
}
