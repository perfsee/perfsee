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

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'

import { SharedColors } from '@perfsee/dls'
import {
  buildProfileFromFlameChartData,
  darkTheme,
  FlamechartContainer,
  lightTheme,
  Timing,
  Frame,
} from '@perfsee/flamechart'
import { FlameChartData, MetricType } from '@perfsee/shared'

import { WebViewProps } from '../types/webview'

import { useVscodeThemeKind } from './theme'

const style = {
  container: {
    width: '100%',
    height: '100%',
  },
}

function getTimingsFromMetric(name: MetricType, value: number): Timing | null {
  value *= 1000

  switch (name as MetricType) {
    case MetricType.FCP:
      return {
        name: 'FCP',
        value,
        color: SharedColors.blue10,
      }

    case MetricType.FMP:
      return {
        name: 'FMP',
        value,
        color: SharedColors.green10,
      }

    case MetricType.LCP:
      return {
        name: 'LCP',
        value,
        color: SharedColors.red10,
      }

    default:
      return null
  }
}

const vscode = window.acquireVsCodeApi()

const Flamechart: React.FunctionComponent<{ data: FlameChartData; focus?: { key: string }; timings?: Timing[] }> = ({
  data,
  focus,
  timings,
}) => {
  const profile = useMemo(() => {
    return buildProfileFromFlameChartData(data)
  }, [data])
  const vscodeTheme = useVscodeThemeKind()
  const theme = vscodeTheme === 'vscode-light' ? lightTheme : darkTheme

  const handleOnOpenFile = useCallback((frame: Frame) => {
    vscode.postMessage({
      type: 'open-frame',
      payload: {
        key: frame.key,
      },
    })
  }, [])
  return (
    <FlamechartContainer
      profile={profile}
      focusedFrame={focus}
      theme={theme}
      onRevealFile={handleOnOpenFile}
      timings={timings}
    />
  )
}

const App = () => {
  const [props, setProps] = useState<WebViewProps | null>(null)

  useEffect(() => {
    const listener = (event: MessageEvent) => {
      if (typeof event.data.type === 'string' && event.data.type === 'update-props') {
        setProps(event.data.payload as WebViewProps)
      }
    }
    window.addEventListener('message', listener)
    vscode.postMessage({
      type: 'ready',
    })

    return () => {
      window.removeEventListener('message', listener)
    }
  })

  const timings = useMemo<Timing[] | undefined>(() => {
    if (!props?.metrics) return
    return Object.keys(props.metrics)
      .map((key) => getTimingsFromMetric(key as MetricType, props.metrics![key]))
      .filter((v) => !!v) as Timing[]
  }, [props])

  const data = useRef<FlameChartData | null>(null)

  if (props?.data && props.data !== 'prev') {
    data.current = props.data
  }

  if (props == null || data.current == null) return <div />

  return (
    <div style={style.container}>
      <Flamechart data={data.current} focus={props.focus} timings={timings} />
    </div>
  )
}

createRoot(document.getElementById('app')!).render(<App />)
