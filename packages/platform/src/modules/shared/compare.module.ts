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

import { Module, EffectModule, ImmerReducer, Effect, Reducer } from '@sigi/core'
import { Draft } from 'immer'
import { isEqual } from 'lodash'
import { distinctUntilChanged, filter, map, Observable, tap, withLatestFrom } from 'rxjs'

import { ProjectModule } from './project.module'

export interface CompareReport {
  name: string
  snapshotId: number
}

export type CompareReports = Record<string /* project id */, Record<number /* reportId */, CompareReport>>
export interface State {
  calloutVisible: boolean
  compareReports: CompareReports
}

export const COMPARASION_STORAGE_KEY = 'perfsee-lab-comparasion'

@Module('CompareModule')
export class CompareModule extends EffectModule<State> {
  defaultState: State

  constructor(private readonly projectModule: ProjectModule) {
    super()
    let compareReports = {}
    const storagedCompareReports = localStorage.getItem(COMPARASION_STORAGE_KEY)
    if (storagedCompareReports) {
      try {
        compareReports = JSON.parse(storagedCompareReports) as CompareReports
      } catch (e) {
        console.error('Failed to parse compare reports: ', String(e))
      }
    }
    this.defaultState = {
      calloutVisible: false,
      compareReports,
    }
  }

  @Effect()
  saveToLocalStorage() {
    return this.state$.pipe(
      distinctUntilChanged((prev, cur) => isEqual(prev.compareReports, cur.compareReports)),
      tap((state) => {
        try {
          localStorage.setItem(COMPARASION_STORAGE_KEY, JSON.stringify(state.compareReports))
        } catch (e) {
          console.error('Failed to set local storage for compare reports:', String(e))
        }
      }),
      map(() => this.getActions().emptyAction()),
    )
  }

  @Effect()
  listenToLocalStorage() {
    return new Observable<CompareReports>((subscriber) => {
      const handler = (event: StorageEvent) => {
        if (event.key === COMPARASION_STORAGE_KEY && event.newValue) {
          subscriber.next(JSON.parse(event.newValue))
        }
      }
      window.addEventListener('storage', handler)
      return () => window.removeEventListener('storage', handler)
    }).pipe(
      withLatestFrom(this.state$, this.projectModule.state$),
      filter(([reports, state, { project }]) => !!project && !isEqual(reports, state.compareReports)),
      map(([reports, state, { project }]) =>
        this.getActions().setCompareReports({
          compareReports: reports,
          calloutVisible: Object.keys(reports[project!.id] || {}).length ? true : state.calloutVisible,
        }),
      ),
    )
  }

  @ImmerReducer()
  addReport(state: Draft<State>, payload: { projectId: string; reportId: number; data: CompareReport }) {
    const { projectId, reportId, data } = payload

    if (state.compareReports[projectId]) {
      state.compareReports[projectId][reportId] = data
    } else {
      state.compareReports[projectId] = {
        [reportId]: data,
      }
    }

    state.calloutVisible = true
  }

  @ImmerReducer()
  setCalloutVisible(state: Draft<State>, payload: boolean) {
    state.calloutVisible = payload
  }

  @ImmerReducer()
  removeReport(state: Draft<State>, { projectId, reportId }: { projectId: string; reportId: number }) {
    const compareReports = { ...state.compareReports }
    if (compareReports[projectId]?.[reportId]) {
      delete compareReports[projectId][reportId]

      if (!Object.keys(compareReports[projectId]).length) {
        delete compareReports[projectId]
      }
    }

    state.compareReports = compareReports
  }

  @Reducer()
  emptyAction(state: State) {
    return state
  }

  @ImmerReducer()
  setCompareReports(
    state: Draft<State>,
    payload: {
      compareReports: CompareReports
      calloutVisible: boolean
    },
  ) {
    state.calloutVisible = payload.calloutVisible
    state.compareReports = payload.compareReports
  }
}
