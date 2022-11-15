import { Effect, EffectModule, ImmerReducer, Module } from '@sigi/core'
import { Draft } from 'immer'
import { filter, map, mergeMap, distinctUntilChanged, Observable, withLatestFrom } from 'rxjs'

import { createErrorCatcher, GraphQLClient } from '@perfsee/platform/common'
import { appVersionByHashQuery, AppVersionByHashQuery } from '@perfsee/schema'

import { ProjectModule } from '../../shared'

export type AppVersion = AppVersionByHashQuery['project']['appVersion']

interface State {
  appVersions: Record<string, AppVersion>
}

@Module('AppVersion')
export class AppVersionModule extends EffectModule<State> {
  readonly defaultState = {
    appVersions: {},
  }

  constructor(private readonly client: GraphQLClient, private readonly projectModule: ProjectModule) {
    super()
  }

  @Effect()
  getAppVersion(payload$: Observable<{ hash: string }>) {
    return payload$.pipe(
      withLatestFrom(this.projectModule.state$),
      filter(([, { project }]) => !!project),
      distinctUntilChanged(([{ hash: hashX }, { project: projectX }], [{ hash: hashY }, { project: projectY }]) => {
        return projectX?.id === projectY?.id && hashX === hashY
      }),
      mergeMap(([{ hash }, { project }]) =>
        this.client
          .query({
            query: appVersionByHashQuery,
            variables: { projectId: project!.id, hash },
          })
          .pipe(
            createErrorCatcher('Failed to get projects list.'),
            map((data) => this.getActions().setAppVersion(data.project.appVersion)),
          ),
      ),
    )
  }

  @ImmerReducer()
  setAppVersion(state: Draft<State>, appVersion: AppVersion) {
    state.appVersions[appVersion.hash] = appVersion
  }
}
