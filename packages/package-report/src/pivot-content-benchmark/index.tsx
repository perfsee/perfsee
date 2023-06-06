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

import { Spinner, Stack, Toggle } from '@fluentui/react'
import { FC, memo, useCallback, useContext, useMemo, useRef, useState } from 'react'

import { useWideScreen } from '@perfsee/components'
import {
  FlamechartContainer,
  importFromChromeCPUProfile,
  ProfileNameSearchEngine,
  FlamechartFactoryMap,
  CPUProfile,
  CallTreeNode,
} from '@perfsee/flamechart'

import { PackageResultContext } from '../context'

import { BenchmarkTitle } from './style'
import { BenchmarkTable } from './table'

const showCaseOnlyFilter = (node: CallTreeNode) => /^(benchmark_case|case)_\d+/.test(node.frame.name)

export const BenchmarkDetail: FC = memo(() => {
  const { current } = useContext(PackageResultContext)
  useWideScreen()

  const [focusedCase, setFocused] = useState<string | undefined>()
  const flameChartRef = useRef<HTMLDivElement>(null)
  const [flameChartMode, setFlamechartMode] = useState<keyof typeof FlamechartFactoryMap>('default')
  const [showCaseOnly, setShowCaseOnly] = useState(true)

  const onTableRowClick = useCallback(
    (item: { name: string; suiteName: string }) => {
      setFocused(current?.benchmarkResult?.results?.find((r) => r.name === item.suiteName)?.rawTestMap?.[item.name])
      flameChartRef.current?.scrollIntoView({ behavior: 'smooth' })
    },
    [current],
  )

  const onFlameChartDbClick = useCallback(() => {
    setFocused(undefined)
  }, [])

  const benchTables = current?.benchmarkResult?.results?.map((data) => (
    <BenchmarkTable summary={data} key={data.date.toString()} onRowClick={onTableRowClick} />
  ))

  const profiles = useMemo(() => {
    if (Array.isArray(current?.benchmarkResult?.profiles)) {
      return current?.benchmarkResult?.profiles?.map((profile) => importFromChromeCPUProfile(profile as CPUProfile))
    } else {
      return current?.benchmarkResult?.profile
        ? [importFromChromeCPUProfile(current.benchmarkResult.profile as CPUProfile)]
        : undefined
    }
  }, [current])

  const flameCharts = profiles
    ? profiles.map((profile, i) => {
        const focusedFrame =
          profile &&
          focusedCase &&
          new ProfileNameSearchEngine(focusedCase).getMatches(profile).entries().next().value?.[0]

        return (
          <div style={{ height: '700px' }} key={i}>
            <FlamechartContainer
              profile={profile}
              focusedFrame={focusedFrame}
              ref={flameChartRef}
              flamechartFactory={flameChartMode}
              onDblclick={onFlameChartDbClick}
              rootFilter={showCaseOnly ? showCaseOnlyFilter : undefined}
            />
          </div>
        )
      })
    : null

  const handleLeftHeavyModeToggle = useCallback((_: React.MouseEvent<HTMLElement>, checked?: boolean) => {
    if (checked) {
      setFlamechartMode('left-heavy')
    } else {
      setFlamechartMode('default')
    }
  }, [])

  const handleShowCaseOnlyToggle = useCallback((_: any, checked?: boolean) => {
    setShowCaseOnly(!!checked)
  }, [])

  if (!current?.benchmarkResult) {
    return (
      <>
        <Spinner>Loading</Spinner>
      </>
    )
  }

  return (
    <>
      <Stack style={{ marginBottom: 70 }}>
        <BenchmarkTitle>Benchmarks</BenchmarkTitle>
        <Stack tokens={{ childrenGap: 30 }}>{benchTables}</Stack>
      </Stack>
      <>
        <Stack horizontal horizontalAlign="space-between">
          <BenchmarkTitle style={{ marginBottom: 30 }}>Flame Chart</BenchmarkTitle>
          <Stack horizontalAlign="end">
            <Toggle
              label="Left Heavy Mode"
              checked={flameChartMode === 'left-heavy'}
              styles={{ text: { whiteSpace: 'pre' } }}
              inlineLabel
              onText="On "
              offText="Off"
              onChange={handleLeftHeavyModeToggle}
            />
            <Toggle
              label="Show Case Only"
              checked={showCaseOnly}
              styles={{ text: { whiteSpace: 'pre' } }}
              inlineLabel
              onText="On "
              offText="Off"
              onChange={handleShowCaseOnlyToggle}
            />
          </Stack>
        </Stack>
        {flameCharts}
      </>
    </>
  )
})
