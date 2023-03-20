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

import { Effect, EffectModule, ImmerReducer, Module, Reducer } from '@sigi/core'
import { Draft } from 'immer'
import {
  endWith,
  exhaustMap,
  filter,
  groupBy,
  map,
  mergeMap,
  Observable,
  startWith,
  switchMap,
  withLatestFrom,
} from 'rxjs'

import { createErrorCatcher, GraphQLClient } from '@perfsee/platform/common'
import {
  PackageBundleFragment,
  packagesQuery,
  PackagesQuery,
  packageBundlesQuery,
  PackageBundlesQuery,
  packageBundleHistoryQuery,
  PackageBundleHistoryQuery,
  deletePackageBundleMutation,
  dispatchPackageJobMutation,
  BundleJobStatus,
} from '@perfsee/schema'

import { ProjectModule } from '../../shared'

export type Package = PackagesQuery['project']['packages']['edges'][0]['node']
type PackageBundleHistory = PackageBundleHistoryQuery['packageBundleHistory']
export type PackageBundle = PackageBundleFragment

export interface State {
  packages: Package[]
  totalCount: number
  loading: boolean
  histories: {
    [packageId: string]: PackageBundleHistory | null
  }
}

export interface PackageQueryParams {
  pageNum: number
  pageSize: number
  name?: string
}

export interface BundlesQueryParams {
  packageId: number
  pageNum: number
  pageSize: number
  branch?: string
}

@Module('PackageListModue')
export class PackageListModule extends EffectModule<State> {
  defaultState = {
    packages: [],
    totalCount: 0,
    loading: true,
    histories: {},
  }

  constructor(private readonly client: GraphQLClient, private readonly projectModule: ProjectModule) {
    super()
  }

  @Effect()
  getBundles(payload$: Observable<BundlesQueryParams>) {
    return payload$.pipe(
      withLatestFrom(this.projectModule.state$),
      filter(([, { project }]) => !!project),
      switchMap(([{ pageNum, pageSize, branch, packageId }, { project }]) => {
        return this.client
          .query({
            query: packageBundlesQuery,
            variables: {
              projectId: project!.id,
              pagination: { first: pageSize, skip: pageSize * (pageNum - 1) },
              branch,
              packageId,
            },
          })
          .pipe(
            createErrorCatcher('Failed to fetch bundles'),
            map((data) => {
              return this.getActions().setBundles({
                packageId,
                bundles: data.project.package.bundles,
              })
            }),
          )
      }),
    )
  }

  @Effect()
  deleteBundle(payload$: Observable<{ packageBundleId: number; packageId: number }>) {
    return payload$.pipe(
      withLatestFrom(this.projectModule.state$),
      filter(([, { project }]) => !!project),
      switchMap(([{ packageBundleId, packageId }, { project }]) => {
        return this.client
          .mutate({
            mutation: deletePackageBundleMutation,
            variables: {
              projectId: project!.id,
              id: packageBundleId,
              packageId,
            },
          })
          .pipe(
            createErrorCatcher('Failed to delete bundle.'),
            map(() => {
              return this.getActions().removeBundle({
                packageId,
                packageBundleId,
              })
            }),
          )
      }),
    )
  }

  @Effect()
  dispatchNewJob(payload$: Observable<{ packageId: number; packageBundleId: number }>) {
    return payload$.pipe(
      withLatestFrom(this.projectModule.state$),
      filter(([, { project }]) => !!project),
      exhaustMap(([{ packageId, packageBundleId }, { project }]) =>
        this.client
          .mutate({
            mutation: dispatchPackageJobMutation,
            variables: { projectId: project!.id, id: packageBundleId, packageId },
          })
          .pipe(
            createErrorCatcher('Failed to dispatch job.'),
            map(() => this.getActions().setStatus({ packageBundleId, packageId, status: BundleJobStatus.Pending })),
          ),
      ),
    )
  }

  @Effect()
  getPackages(payload$: Observable<PackageQueryParams>) {
    return payload$.pipe(
      withLatestFrom(this.projectModule.state$),
      filter(([, { project }]) => !!project),
      switchMap(([{ pageNum, pageSize, name }, { project }]) =>
        this.client
          .query({
            query: packagesQuery,
            variables: {
              projectId: project!.id,
              pagination: { first: pageSize, skip: pageSize * (pageNum - 1) },
              name,
              withBundles: true,
            },
          })
          .pipe(
            createErrorCatcher('Failed to fetch packages'),
            map((data) => {
              return this.getActions().setArtifacts(data.project.packages)
            }),
            startWith(this.getActions().setLoading(true)),
            endWith(this.getActions().setLoading(false)),
          ),
      ),
    )
  }

  @Effect()
  getHistory(payload$: Observable<{ packageId: string; currentDateTime: string; branch?: string }>) {
    return payload$.pipe(
      groupBy(({ packageId }) => packageId),
      mergeMap((group) => {
        return group.pipe(
          switchMap(({ packageId, currentDateTime, branch }) => {
            const to = new Date(new Date(currentDateTime).valueOf() + 1000).toString()
            return this.client
              .query({
                query: packageBundleHistoryQuery,
                variables: {
                  packageId,
                  to,
                  branch,
                  limit: 20,
                },
              })
              .pipe(
                createErrorCatcher('Failed to get package history'),
                map(({ packageBundleHistory }) =>
                  this.getActions().setHistory({ history: packageBundleHistory.reverse(), packageId }),
                ),
              )
          }),
        )
      }),
    )
  }

  @ImmerReducer()
  setHistory(state: Draft<State>, { history, packageId }: { history: PackageBundleHistory | null; packageId: string }) {
    state.histories[packageId] = history
  }

  @ImmerReducer()
  setArtifacts(state: Draft<State>, { pageInfo, edges }: PackagesQuery['project']['packages']) {
    state.packages = edges.map((edge) => edge.node)
    state.totalCount = pageInfo.totalCount
  }

  @ImmerReducer()
  setStatus(
    state: Draft<State>,
    { packageBundleId, status, packageId }: { packageBundleId: number; packageId: number; status: BundleJobStatus },
  ) {
    const pkg = state.packages.find((pkg) => pkg.id === packageId)
    if (pkg) {
      const bundle = pkg.bundles?.edges.find(({ node }) => node.id === packageBundleId)
      if (bundle) {
        bundle.node.status = status
      }
    }
  }

  @ImmerReducer()
  setBundles(
    state: Draft<State>,
    { packageId, bundles }: { packageId: number; bundles: PackageBundlesQuery['project']['package']['bundles'] },
  ) {
    const pkg = state.packages.find((pkg) => pkg.id === packageId)
    if (pkg) {
      pkg.bundles = bundles
    }
  }

  @ImmerReducer()
  setLoading(state: Draft<State>, loading: boolean) {
    state.loading = loading
  }

  @Reducer()
  resetState(): State {
    return this.defaultState
  }

  @ImmerReducer()
  removeBundle(state: Draft<State>, { packageId, packageBundleId }: { packageId: number; packageBundleId: number }) {
    const pkg = state.packages.find((pkg) => pkg.id === packageId)
    if (pkg?.bundles) {
      pkg.bundles.edges = pkg.bundles.edges.filter(({ node }) => node.id !== packageBundleId)
    }
  }
}
