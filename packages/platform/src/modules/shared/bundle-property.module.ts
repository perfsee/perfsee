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

import { Effect, EffectModule, ImmerReducer, Module } from '@sigi/core'
import { Draft } from 'immer'
import { filter, map, Observable, switchMap, withLatestFrom } from 'rxjs'

import { createErrorCatcher, GraphQLClient } from '@perfsee/platform/common'
import { recentArtifactNamesQuery, recentBranchesQuery, recentEntrypointsQuery } from '@perfsee/schema'

import { ProjectModule } from './project.module'

type State = {
  recentBranches: string[]
  artifactNames: string[]
  entrypoints: string[]
}

@Module('BundlePropertiesModule')
export class BundlePropertiesModule extends EffectModule<State> {
  defaultState = {
    recentBranches: [],
    artifactNames: [],
    entrypoints: [],
  }

  constructor(private readonly client: GraphQLClient, private readonly project: ProjectModule) {
    super()
  }

  @ImmerReducer()
  setBranches(state: Draft<State>, branches: string[]) {
    state.recentBranches = branches
  }

  @ImmerReducer()
  setArtifactNames(state: Draft<State>, names: string[]) {
    state.artifactNames = names
  }

  @ImmerReducer()
  setEntrypoints(state: Draft<State>, entrypoints: string[]) {
    state.entrypoints = entrypoints
  }

  @Effect()
  getBranches(payload$: Observable<void>) {
    return payload$.pipe(
      this.project.withProject,
      switchMap(([project]) =>
        this.client
          .query({
            query: recentBranchesQuery,
            variables: { projectId: project.id },
          })
          .pipe(
            createErrorCatcher('Failed to get branch information'),
            map((data) => this.getActions().setBranches(data.project.recentBranches)),
          ),
      ),
    )
  }

  @Effect()
  getRecentArtifactNames(payload$: Observable<void>) {
    return payload$.pipe(
      this.project.withProject,
      switchMap(([project]) =>
        this.client
          .query({
            query: recentArtifactNamesQuery,
            variables: {
              projectId: project.id,
            },
          })
          .pipe(
            createErrorCatcher('Failed to fetch artifact names'),
            map((data) => {
              return this.getActions().setArtifactNames(data.project.artifactNames)
            }),
          ),
      ),
    )
  }

  @Effect()
  getEntrypoints(payload$: Observable<{ artifactName?: string; branch?: string }>) {
    return payload$.pipe(
      withLatestFrom(this.project.state$),
      filter(([, { project }]) => !!project),
      switchMap(([{ artifactName, branch }, { project }]) =>
        this.client
          .query({
            query: recentEntrypointsQuery,
            variables: {
              projectId: project!.id,
              artifactName,
              branch,
            },
          })
          .pipe(
            createErrorCatcher('Failed to fetch artifact names'),
            map((data) => {
              return this.getActions().setEntrypoints(data.project.entrypointNames)
            }),
          ),
      ),
    )
  }
}
