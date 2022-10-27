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

import { Module, EffectModule, Effect, ImmerReducer, Reducer } from '@sigi/core'
import { Draft, enableMapSet } from 'immer'
import { pick } from 'lodash'
import { Observable, of } from 'rxjs'
import {
  distinctUntilChanged,
  endWith,
  filter,
  map,
  mergeMap,
  startWith,
  switchMap,
  withLatestFrom,
} from 'rxjs/operators'

import { GraphQLClient, createErrorCatcher } from '@perfsee/platform/common'
import {
  SettingPropertyQuery,
  settingPropertyQuery,
  updateProfileMutation,
  deleteProfileMutation,
  deletePageMutation,
  updatePageMutation,
  deleteEnvironmentMutation,
  updateEnvironmentMutation,
  pageRelationsQuery,
  propertyQuery,
  PropertyQuery,
  createPageMutation,
  pingResultQuery,
  PingResultQuery,
  pingMutation,
} from '@perfsee/schema'

import { ProjectModule } from './project.module'
import {
  ConnectionType,
  DeviceType,
  EnvSchema,
  PageRelation,
  PageSchema,
  ProfileSchema,
  UpdatePagePayload,
  DeleteProgress,
} from './property-type'

export type PingResult = PingResultQuery['project']['pingResult'][0]

interface State {
  loading: boolean
  pages: PageSchema[]
  profiles: ProfileSchema[]
  environments: EnvSchema[]
  connections: ConnectionType[]
  devices: DeviceType[]
  zones: string[]
  defaultZone: string
  pageRelationMap: Map<number /* pageId */, PageRelation>
  pingResultMap: Map<number /**pageId */, PingResult[]>
  pageMap: Map<number /* pageId */, PageSchema>
  profileMap: Map<number /* profileId */, ProfileSchema>
  envMap: Map<number /* envId */, EnvSchema>
  deleteProgress: {
    page: DeleteProgress
    env: DeleteProgress
    profile: DeleteProgress
  }
}

enableMapSet()

@Module('PropertyModule')
export class PropertyModule extends EffectModule<State> {
  readonly defaultState = {
    loading: true,
    pages: [],
    profiles: [],
    environments: [],
    connections: [],
    devices: [],
    entries: [],
    labels: [],
    pageRelationMap: new Map<number, PageRelation>(),
    pingResultMap: new Map<number, PingResult[]>(),
    pageMap: new Map() as Map<number, PageSchema>,
    profileMap: new Map() as Map<number, ProfileSchema>,
    envMap: new Map() as Map<number, EnvSchema>,
    zones: [],
    defaultZone: '',
    deleteProgress: {
      page: DeleteProgress.None,
      env: DeleteProgress.None,
      profile: DeleteProgress.None,
    },
  }

  constructor(private readonly client: GraphQLClient, private readonly projectModule: ProjectModule) {
    super()
  }

  @ImmerReducer()
  setLoading(state: Draft<State>, payload: boolean) {
    state.loading = payload
  }

  @ImmerReducer()
  setProperty(state: Draft<State>, { project }: PropertyQuery) {
    state.pages = project.pages
    state.profiles = project.profiles
    state.environments = project.environments

    const pageMap = new Map<number, PageSchema>()
    const profileMap = new Map<number, ProfileSchema>()
    const envMap = new Map<number, EnvSchema>()
    project.pages.forEach((p) => {
      pageMap.set(p.id, p)
    })
    project.profiles.forEach((p) => {
      profileMap.set(p.id, p)
    })
    project.environments.forEach((e) => {
      envMap.set(e.id, e)
    })

    state.pageMap = pageMap
    state.profileMap = profileMap
    state.envMap = envMap
  }

  @ImmerReducer()
  resetProperty(state: Draft<State>) {
    state.pages = []
    state.profiles = []
    state.environments = []

    state.pageMap = new Map()
    state.profileMap = new Map()
    state.envMap = new Map()
  }

  @ImmerReducer()
  setSettingProperty(state: Draft<State>, payload: SettingPropertyQuery) {
    state.connections = payload.connections
    state.devices = payload.devices
    state.zones = payload.zone.all
    state.defaultZone = payload.zone.default
  }

  @ImmerReducer()
  resetSettingProperty(state: Draft<State>) {
    state.connections = []
    state.devices = []
  }

  @ImmerReducer()
  setRelations(state: Draft<State>, payload: PageRelation[]) {
    const relationMap = new Map<number, PageRelation>()
    payload.forEach((relation) => {
      relationMap.set(relation.pageId, relation)
    })
    state.pageRelationMap = relationMap
  }

  @Reducer()
  setPingResult(state: Draft<State>, payload: { pageId: number; result: PingResult[] }) {
    const map = new Map(state.pingResultMap)
    map.set(payload.pageId, payload.result)

    return { ...state, pingResultMap: map }
  }

  @Reducer()
  addPingResult(state: Draft<State>, payload: { pageId: number; profileId?: number; envId?: number }) {
    const { pageId, profileId, envId } = payload
    const pingResult = state.pingResultMap.get(pageId) ?? []
    const map = new Map(state.pingResultMap)

    if (profileId && envId) {
      const key = `${pageId}-${profileId}-${envId}`
      const index = pingResult.findIndex((result) => result.key === key)
      if (index !== -1) {
        pingResult[index] = { key, status: 'pending' }
      } else {
        pingResult.push({ key, status: 'pending' })
      }
    } else {
      pingResult.forEach((result) => (result.status = 'pending'))
    }

    map.set(payload.pageId, pingResult)
    return { ...state, pingResultMap: map }
  }

  @Reducer()
  addRelation(state: Draft<State>, payload: { relation: PageRelation; connectPageId?: number }) {
    const { relation, connectPageId } = payload
    const map = new Map(state.pageRelationMap)
    map.set(relation.pageId, relation)

    // if create a competitor page
    if (connectPageId) {
      const connectRelation = map.get(connectPageId)!
      map.set(connectPageId, {
        ...connectRelation,
        competitorIds: [...connectRelation.competitorIds, relation.pageId],
      })
    }

    return { ...state, pageRelationMap: map }
  }

  @ImmerReducer()
  resetRelations(state: Draft<State>) {
    state.pageRelationMap = new Map()
  }

  @ImmerReducer()
  setProfiles(state: Draft<State>, payload: ProfileSchema) {
    let flag = true
    state.profiles = state.profiles.map((profile) => {
      if (profile.id === payload.id) {
        flag = false
        return payload
      }
      return profile
    })
    if (flag) {
      state.profiles = [...state.profiles, payload]
    }

    state.profileMap.set(payload.id, payload)
  }

  @ImmerReducer()
  setEnvironments(state: Draft<State>, payload: EnvSchema) {
    let flag = true
    state.environments = state.environments.map((env) => {
      if (env.id === payload.id) {
        flag = false
        return payload
      }
      return env
    })
    if (flag) {
      state.environments = [...state.environments, payload]
    }

    state.envMap.set(payload.id, payload)
  }

  @ImmerReducer()
  setPages(state: Draft<State>, payload: PageSchema) {
    let isNew = true
    const pages = state.pages.map((page) => {
      if (page.id === payload.id) {
        isNew = false
        return {
          ...page,
          ...payload,
        }
      }
      return page
    })
    state.pages = isNew ? [...pages, payload] : pages

    state.pageMap.set(payload.id, payload)
  }

  @ImmerReducer()
  removeProfile(state: Draft<State>, payload: number) {
    state.profiles = state.profiles.filter((profile) => profile.id !== payload)
    state.profileMap.delete(payload)
  }

  @ImmerReducer()
  removePage(state: Draft<State>, payload: number) {
    state.pages = state.pages.filter((page) => page.id !== payload)
    state.pageMap.delete(payload)
  }

  @ImmerReducer()
  removeEnvironment(state: Draft<State>, payload: number) {
    state.environments = state.environments.filter((env) => env.id !== payload)
    state.envMap.delete(payload)
  }

  @ImmerReducer()
  setDeleteProgress(
    state: Draft<State>,
    { type, progress }: { type: keyof State['deleteProgress']; progress: DeleteProgress },
  ) {
    state.deleteProgress[type] = progress
  }

  @Effect()
  fetchPageRelation(payload$: Observable<void>) {
    return payload$.pipe(
      withLatestFrom(this.projectModule.state$),
      distinctUntilChanged(([, { project: projectX }], [, { project: projectY }]) => {
        return projectX?.id === projectY?.id
      }),
      filter(([, { project }]) => !!project?.id),
      switchMap(([, { project }]) =>
        this.client
          .query({
            query: pageRelationsQuery,
            variables: {
              projectId: project!.id,
            },
          })
          .pipe(
            createErrorCatcher('Failed to fetch page relations'),
            map((data) => this.getActions().setRelations(data.project.pageRelations)),
            startWith(this.getActions().resetRelations()),
          ),
      ),
    )
  }

  @Effect()
  fetchPingCheckStatus(payload$: Observable<number>) {
    return payload$.pipe(
      withLatestFrom(this.projectModule.state$),
      filter(([, { project }]) => !!project?.id),
      switchMap(([pageId, { project }]) =>
        this.client
          .query({
            query: pingResultQuery,
            variables: {
              projectId: project!.id,
              pageId: pageId,
            },
          })
          .pipe(
            createErrorCatcher('Failed to fetch ping result'),
            map((data) => this.getActions().setPingResult({ pageId, result: data.project.pingResult })),
          ),
      ),
    )
  }

  @Effect()
  pingCheck(payload$: Observable<{ pageId: number; envId?: number; profileId?: number }>) {
    return payload$.pipe(
      withLatestFrom(this.projectModule.state$),
      filter(([, { project }]) => !!project?.id),
      switchMap(([payload, { project }]) =>
        this.client
          .query({
            query: pingMutation,
            variables: {
              projectId: project!.id,
              ...payload,
            },
          })
          .pipe(
            createErrorCatcher('Failed to ping check'),
            map(() => this.getActions().addPingResult(payload)),
          ),
      ),
    )
  }

  @Effect()
  fetchProperty(payload$: Observable<void>) {
    return payload$.pipe(
      withLatestFrom(this.projectModule.state$),
      filter(([, { project }]) => !!project?.id),
      distinctUntilChanged(([, { project: projectX }], [, { project: projectY }]) => {
        return projectX?.id === projectY?.id
      }),
      switchMap(([, { project }]) =>
        this.client
          .query({
            query: propertyQuery,
            variables: {
              projectId: project!.id,
            },
          })
          .pipe(
            createErrorCatcher('Failed to fetch pages/envs/profiles'),
            map((data) => this.getActions().setProperty(data)),
            startWith(this.getActions().resetProperty()),
            endWith(this.getActions().setLoading(false)),
          ),
      ),
    )
  }

  @Effect()
  fetchSettingProperty(payload$: Observable<void>) {
    return payload$.pipe(
      switchMap(() =>
        this.client
          .query({
            query: settingPropertyQuery,
          })
          .pipe(
            createErrorCatcher('Failed to fetch setting property'),
            map((data) => this.getActions().setSettingProperty(data)),
            startWith(this.getActions().resetSettingProperty()),
          ),
      ),
    )
  }

  @Effect()
  updateOrCreateProfile(payload$: Observable<Partial<ProfileSchema>>) {
    return payload$.pipe(
      withLatestFrom(this.projectModule.state$),
      switchMap(([profile, { project }]) =>
        this.client
          .mutate({
            mutation: updateProfileMutation,
            variables: {
              profileInput: profile,
              projectId: project!.id,
            },
            keepNilVariables: true,
          })
          .pipe(
            createErrorCatcher('Failed to update or create profile.'),
            map((result) => {
              const profile = result.updateOrCreateProfile
              return this.getActions().setProfiles(profile)
            }),
          ),
      ),
    )
  }

  @Effect()
  deleteProfile(payload$: Observable<number>) {
    return payload$.pipe(
      withLatestFrom(this.projectModule.state$),
      switchMap(([id, { project }]) =>
        this.client
          .mutate({
            mutation: deleteProfileMutation,
            variables: {
              id,
              projectId: project!.id,
            },
          })
          .pipe(
            createErrorCatcher('Failed to delete profile.'),
            map(() => {
              return this.getActions().removeProfile(id)
            }),
            startWith(this.getActions().setDeleteProgress({ type: 'profile', progress: DeleteProgress.Running })),
            endWith(this.getActions().setDeleteProgress({ type: 'profile', progress: DeleteProgress.Done })),
          ),
      ),
    )
  }

  @Effect()
  updateOrCreatePage(payload$: Observable<UpdatePagePayload>) {
    return payload$.pipe(
      withLatestFrom(this.projectModule.state$),
      switchMap(([{ page, relation, connectPageId }, { project }]) =>
        this.client
          .mutate({
            mutation: page.id ? updatePageMutation : createPageMutation,
            variables: {
              pageInput: {
                ...page,
                connectPageId,
                ...pick(relation, ['profileIds', 'envIds', 'competitorIds']),
              },
              projectId: project!.id,
            },
          })
          .pipe(
            createErrorCatcher('Failed to update or create page.'),
            mergeMap((result) => {
              const page = 'updatePage' in result ? result.updatePage : result.createPage
              return of(
                this.getActions().addRelation({
                  relation: { ...relation, pageId: page.id },
                  connectPageId,
                }),
                this.getActions().setPages(page),
              )
            }),
          ),
      ),
    )
  }

  @Effect()
  deletePage(payload$: Observable<number>) {
    return payload$.pipe(
      withLatestFrom(this.projectModule.state$),
      switchMap(([id, { project }]) =>
        this.client
          .mutate({
            mutation: deletePageMutation,
            variables: { id, projectId: project!.id },
          })
          .pipe(
            createErrorCatcher('Failed to delete page.'),
            map(() => {
              return this.getActions().removePage(id)
            }),
            startWith(this.getActions().setDeleteProgress({ type: 'page', progress: DeleteProgress.Running })),
            endWith(this.getActions().setDeleteProgress({ type: 'page', progress: DeleteProgress.Done })),
          ),
      ),
    )
  }

  @Effect()
  updateOrCreateEnv(payload$: Observable<Partial<EnvSchema>>) {
    return payload$.pipe(
      withLatestFrom(this.projectModule.state$),
      switchMap(([env, { project }]) =>
        this.client
          .mutate({
            mutation: updateEnvironmentMutation,
            variables: {
              envInput: env,
              projectId: project!.id,
            },
          })
          .pipe(
            createErrorCatcher('Failed to update or create Environment.'),
            map((result) => {
              const env = result.updateEnvironment
              return this.getActions().setEnvironments(env)
            }),
          ),
      ),
    )
  }

  @Effect()
  deleteEnvironment(payload$: Observable<number>) {
    return payload$.pipe(
      withLatestFrom(this.projectModule.state$),
      switchMap(([id, { project }]) =>
        this.client
          .mutate({
            mutation: deleteEnvironmentMutation,
            variables: { id, projectId: project!.id },
          })
          .pipe(
            createErrorCatcher('Failed to delete environment.'),
            map(() => {
              return this.getActions().removeEnvironment(id)
            }),
            startWith(this.getActions().setDeleteProgress({ type: 'env', progress: DeleteProgress.Running })),
            endWith(this.getActions().setDeleteProgress({ type: 'env', progress: DeleteProgress.Done })),
          ),
      ),
    )
  }
}
