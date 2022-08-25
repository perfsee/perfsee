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
import { Observable } from 'rxjs'
import { endWith, filter, map, startWith, switchMap, withLatestFrom } from 'rxjs/operators'

import { createErrorCatcher, GraphQLClient } from '@perfsee/platform/common'
import { issueCommitsQuery, sourceIssuesQuery, SourceIssuesQuery } from '@perfsee/schema'

import { ProjectModule } from '../shared'

export type SourceIssue = SourceIssuesQuery['project']['sourceIssues']['edges'][0]['node']

interface State {
  hashes: string[]
  issues: SourceIssue[]
  totalCount: number
  loadingIssue: boolean
  loadingHashes: boolean
}

export interface SourceIssuesQueryParams {
  pageNum: number
  pageSize: number
  hash: string
}

@Module('SourceIssuesModule')
export class SourceIssuesModule extends EffectModule<State> {
  defaultState = {
    hashes: [],
    issues: [],
    totalCount: 0,
    loadingIssue: true,
    loadingHashes: true,
  }

  constructor(private readonly client: GraphQLClient, private readonly projectModule: ProjectModule) {
    super()
  }

  @Effect()
  getIssues(payload$: Observable<SourceIssuesQueryParams>) {
    return payload$.pipe(
      withLatestFrom(this.projectModule.state$),
      filter(([, { project }]) => !!project),
      switchMap(([{ pageNum, pageSize, hash }, { project }]) =>
        this.client
          .query({
            query: sourceIssuesQuery,
            variables: {
              projectId: project!.id,
              hash,
              pagination: { first: pageSize, skip: pageSize * (pageNum - 1) },
            },
          })
          .pipe(
            createErrorCatcher('Failed to fetch issues'),
            map((data) => {
              return this.getActions().setIssues(data.project.sourceIssues)
            }),
            startWith(this.getActions().setLoadingIssue(true)),
            endWith(this.getActions().setLoadingIssue(false)),
          ),
      ),
    )
  }

  @Effect()
  getIssueCommits(payload$: Observable<void>) {
    return payload$.pipe(
      withLatestFrom(this.projectModule.state$),
      filter(([, { project }]) => !!project),
      switchMap(([, { project }]) =>
        this.client
          .query({
            query: issueCommitsQuery,
            variables: { projectId: project!.id },
          })
          .pipe(
            createErrorCatcher('Failed to fetch issues'),
            map((data) => this.getActions().setHashes(data.project.issueCommits)),
            startWith(this.getActions().setLoadingHashes(true)),
            endWith(this.getActions().setLoadingHashes(false)),
          ),
      ),
    )
  }

  @ImmerReducer()
  setLoadingIssue(state: Draft<State>, loading: boolean) {
    state.loadingIssue = loading
  }

  @ImmerReducer()
  setLoadingHashes(state: Draft<State>, loading: boolean) {
    state.loadingHashes = loading
  }

  @ImmerReducer()
  setIssues(state: Draft<State>, { pageInfo, edges }: SourceIssuesQuery['project']['sourceIssues']) {
    state.issues = edges.map((edge) => edge.node)
    state.totalCount = pageInfo.totalCount
  }

  @ImmerReducer()
  setHashes(state: Draft<State>, hashes: string[]) {
    state.hashes = hashes
  }
}
