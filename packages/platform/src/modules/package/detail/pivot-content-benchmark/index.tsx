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
import { useInstance, useModule } from '@sigi/react'
import { FC, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useWideScreen } from '@perfsee/components'
import {
  FlamechartContainer,
  importFromChromeCPUProfile,
  ProfileNameSearchEngine,
  FlamechartFactoryMap,
  CPUProfile,
  CallTreeNode,
} from '@perfsee/flamechart'
import { RxFetch } from '@perfsee/platform/common'
import { BenchmarkResult } from '@perfsee/shared'

import { PackageBundleDetailModule } from '../module'

import { BenchmarkTitle } from './style'
import { BenchmarkTable } from './table'

const showCaseOnlyFilter = (node: CallTreeNode) => /^(benchmark_case|case)_\d+/.test(node.frame.name)

export const BenchmarkDetail: FC<{ packageId: string; packageBundleId: string; projectId: string }> = memo(() => {
  useWideScreen()

  const [focusedCase, setFocused] = useState<string | undefined>()
  const flameChartRef = useRef<HTMLDivElement>(null)
  const [flameChartMode, setFlamechartMode] = useState<keyof typeof FlamechartFactoryMap>('default')
  const [showCaseOnly, setShowCaseOnly] = useState(true)
  const fetchClient = useInstance(RxFetch)
  const [result, setResult] = useState<BenchmarkResult | null>(null)
  const [state] = useModule(PackageBundleDetailModule)
  const [loading, setLoading] = useState(false)

  const link = state.current?.benchmarkLink

  const benchmarkResults = result?.results

  useEffect(() => {
    setLoading(true)
    const subscription = link
      ? fetchClient.get<BenchmarkResult>(link).subscribe((res) => {
          setResult(res)
          setLoading(false)
        })
      : undefined

    return () => subscription?.unsubscribe()
  }, [fetchClient, link])

  const onTableRowClick = useCallback(
    (item: { name: string; suiteName: string }) => {
      setFocused(benchmarkResults?.find((r) => r.name === item.suiteName)?.rawTestMap?.[item.name])
      flameChartRef.current?.scrollIntoView({ behavior: 'smooth' })
    },
    [benchmarkResults],
  )

  const onFlameChartDbClick = useCallback(() => {
    setFocused(undefined)
  }, [])

  const benchTables = benchmarkResults?.map((data) => (
    <BenchmarkTable summary={data} key={data.date.toString()} onRowClick={onTableRowClick} />
  ))

  const profile = useMemo(() => result?.profile && importFromChromeCPUProfile(result.profile as CPUProfile), [result])

  const focusedFrame = useMemo(() => {
    return (
      profile && focusedCase && new ProfileNameSearchEngine(focusedCase).getMatches(profile).entries().next().value?.[0]
    )
  }, [profile, focusedCase])
  const flameChart = profile ? (
    <FlamechartContainer
      profile={profile}
      focusedFrame={focusedFrame}
      ref={flameChartRef}
      flamechartFactory={flameChartMode}
      onDblclick={onFlameChartDbClick}
      rootFilter={showCaseOnly ? showCaseOnlyFilter : undefined}
    />
  ) : null

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

  if (loading) {
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
        {/* flamechart requires a fixed height parent element */}
        <div style={{ height: '700px' }}>{flameChart}</div>
      </>
    </>
  )
})
