import { Effect, EffectModule, ImmerReducer, Module } from '@sigi/core'
import { Draft } from 'immer'
import { filter, map, mergeMap, distinctUntilChanged, Observable, withLatestFrom, catchError, of } from 'rxjs'

import { GraphQLClient } from '@perfsee/platform/common'
import { appVersionByHashQuery, AppVersionByHashQuery } from '@perfsee/schema'

import { ProjectModule } from '../../shared'

export type AppVersion = AppVersionByHashQuery['project']['appVersion']

interface State {
  appVersions: Record<string, { appVersion?: AppVersion; error?: string }>
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
            map((data) => this.getActions().setAppVersion({ hash, appVersion: data.project.appVersion })),
            catchError((_) => of(this.getActions().setError({ hash, error: 'Commit not found' }))),
          ),
      ),
    )
  }

  @ImmerReducer()
  setError(state: Draft<State>, { hash, error }: { hash: string; error: string }) {
    state.appVersions[hash] = { error: error }
  }

  @ImmerReducer()
  setAppVersion(state: Draft<State>, { hash, appVersion }: { hash: string; appVersion: AppVersion }) {
    state.appVersions[hash] = { appVersion: appVersion }
  }
}
