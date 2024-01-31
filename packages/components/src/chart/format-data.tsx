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

type SeriesData<S extends Record<string, any>> = Record<S[keyof S], Array<[S[keyof S], S[keyof S]]>>
type GroupedData<S extends Record<string, any>> = Record<S[keyof S], Record<S[keyof S], S>>

export function formatChartData<T, S extends Record<string, any>>(
  /** data to be formatted */
  rawData: T[],
  /** series key */
  seriesKey: keyof S,
  /** x axis key */
  xKey: keyof S,
  /** y axis key */
  yKey: keyof S,
  /** custom inner data format function */
  formatter?: (data: T) => S,
) {
  const formattedData = {} as SeriesData<S>
  const groupData = {} as GroupedData<S>

  const xAxisData = new Set<S[typeof xKey]>()

  rawData.forEach((data) => {
    const formatted = formatter ? formatter(data) : (data as any as S)
    const groupKey = formatted[seriesKey]

    const rawGroup = groupData[groupKey] ?? {}
    rawGroup[formatted[xKey]] = formatted
    groupData[groupKey] = rawGroup

    const rawList = formattedData[groupKey] ?? []
    formattedData[groupKey] = [...rawList, [formatted[xKey], formatted[yKey]]]

    xAxisData.add(formatted[xKey])
  })

  const sortedData = {} as SeriesData<S>
  Object.keys(formattedData)
    .sort((a, b) => formattedData[b].length - formattedData[a].length)
    .forEach((key) => {
      sortedData[key] = formattedData[key]
    })

  return {
    data: sortedData,
    groupData,
    xAxisData: [...xAxisData],
  }
}
