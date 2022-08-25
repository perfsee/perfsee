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

import { ClassProvider, Inject, Type } from '@nestjs/common'

type Reducer<Arr extends ReadonlyArray<string>, Result extends Record<string, any> = object> = Arr extends []
  ? // last step of iteration
    Result
  : // if there are still tuples in the array
  Arr extends readonly [infer H, ...infer Tail]
  ? Tail extends ReadonlyArray<string>
    ? H extends string
      ? // call utility type recursively and produce record type with help of predicate
        Reducer<Tail, Result & Record<H, any>>
      : never
    : never
  : never

type MetricLabels<T extends string[]> = Partial<Reducer<NonNullable<T>>>
type Callback<T extends string[]> = (value: number, labels?: MetricLabels<T>) => void
export type MetricType = <T extends string[]>(name: string, labelNames?: [...T] | []) => Callback<T>
export type TimerMetricType = <T extends string[]>(
  name: string,
  labelNames?: [...T] | [],
) => (labels?: MetricLabels<T>) => () => void

export interface MetricsProvider {
  counter: MetricType
  store: MetricType
  timer: TimerMetricType
  time: MetricType
  meter: MetricType
}

const MetricsProvide = Symbol('MetricsProvide')

export function registerMetricsProvider<T extends MetricsProvider>(provider: Type<T>): ClassProvider<T> {
  return {
    provide: MetricsProvide,
    useClass: provider,
  }
}

export const MetricsProvider = Inject(MetricsProvide)
