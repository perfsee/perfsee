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
  }

  @ImmerReducer()
  removeProfile(state: Draft<State>, payload: number) {
    state.profiles = state.profiles.filter((profile) => profile.id !== payload)
  }

  @ImmerReducer()
  removePage(state: Draft<State>, payload: number) {
    state.pages = state.pages.filter((page) => page.id !== payload)
  }

  @ImmerReducer()
  removeEnvironment(state: Draft<State>, payload: number) {
    state.environments = state.environments.filter((env) => env.id !== payload)
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
