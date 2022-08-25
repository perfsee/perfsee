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

import { Effect, EffectModule, Module, Reducer } from '@sigi/core'
import { Observable, switchMap, of, delay, map, mergeMap, withLatestFrom, distinctUntilChanged, filter } from 'rxjs'

interface TooltipOpenProps {
  targetClientRect: { left: number; top: number; width: number; height: number }
  data: any
}

interface State {
  tooltip: TooltipOpenProps | null
  hoverTooltip: boolean
}

@Module('TreeMapControllerModule')
export class TreeMapControllerModule extends EffectModule<State> {
  defaultState = {
    tooltip: null,
    hoverTooltip: false,
  }

  @Effect()
  updateTooltip(payload$: Observable<TooltipOpenProps | null>) {
    return payload$.pipe(
      withLatestFrom(this.state$),
      mergeMap(([props, { tooltip }]) => {
        if (!tooltip || !props) {
          return of(this.getActions().updateTooltipVisibility(props))
        } else if (tooltip.data !== props.data) {
          return of(this.getActions().updateTooltipVisibility(null))
        } else if (tooltip.targetClientRect !== props.targetClientRect) {
          return of(this.getActions().updateTooltipTargetRect(props.targetClientRect))
        } else {
          return of()
        }
      }),
    )
  }

  @Effect()
  hoverTooltip(payload$: Observable<boolean>) {
    return payload$.pipe(
      mergeMap((hover) => {
        return of(this.getActions().setHoverTooltip(hover))
      }),
    )
  }

  @Effect()
  updateTooltipVisibility(payload$: Observable<TooltipOpenProps | null>) {
    return payload$.pipe(
      withLatestFrom(this.state$),
      distinctUntilChanged((a, b) => a[0] === b[0] && a[1].hoverTooltip === b[1].hoverTooltip),
      switchMap(([data]) =>
        of(data).pipe(
          delay(250),
          withLatestFrom(this.state$),
          filter(([_, { hoverTooltip }]) => !hoverTooltip),
          map(([data]) => {
            return data ? this.getActions().setTooltip(data) : this.getActions().closeTooltip()
          }),
        ),
      ),
    )
  }

  @Reducer()
  updateTooltipTargetRect(state: State, payload: TooltipOpenProps['targetClientRect']) {
    if (state.tooltip) {
      return {
        ...state,
        tooltip: {
          ...state.tooltip,
          targetClientRect: payload,
        },
      }
    } else {
      return state
    }
  }

  @Reducer()
  closeTooltip(state: State) {
    return {
      ...state,
      tooltip: null,
    }
  }

  @Reducer()
  setTooltip(state: State, payload: TooltipOpenProps) {
    return {
      ...state,
      tooltip: {
        targetClientRect: payload.targetClientRect,
        data: payload.data,
      },
    }
  }

  @Reducer()
  setHoverTooltip(state: State, payload: boolean) {
    return {
      ...state,
      hoverTooltip: payload,
    }
  }
}
