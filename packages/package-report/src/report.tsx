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

import '@abraham/reflection'
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  RightOutlined,
  TagOutlined,
  DownOutlined,
  SwapOutlined,
} from '@ant-design/icons'
import { useTheme } from '@emotion/react'
import styled from '@emotion/styled'
import { loadTheme, registerIcons } from '@fluentui/react'
import { createTheme } from '@fluentui/theme'
import { MDXProvider } from '@mdx-js/react'
import dayjs from 'dayjs'
import calendar from 'dayjs/plugin/calendar'
import duration from 'dayjs/plugin/duration'
import relativeTime from 'dayjs/plugin/relativeTime'
import { useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { Switch, Route, MemoryRouter } from 'react-router'

import { MDXComponents } from '@perfsee/components'
import { ThemeProvider } from '@perfsee/dls'
import { BundleJobStatus } from '@perfsee/schema'

import { PackageResultContext } from './context'
import { PackageBundleHistory, PackageBundleResult } from './types'

import { PackageDetail } from './index'

dayjs.extend(relativeTime)
dayjs.extend(calendar)
dayjs.extend(duration)

registerIcons({
  icons: {
    ChevronRightMed: <RightOutlined />,
    Tag: <TagOutlined />,
    sortdown: <ArrowDownOutlined />,
    sortup: <ArrowUpOutlined />,
    chevrondown: <DownOutlined />,
    swap: <SwapOutlined />,
  },
})

const ReportContainer = styled('div')({
  width: 1280,
  margin: '0 auto',
})

function PackageReportContainer() {
  const packageResult: {
    current: PackageBundleResult
    loading: boolean
    history?: PackageBundleHistory
    historyLoading: boolean
    isLocal: boolean
  } = {
    current: {
      ...window.report,
      report: window.report,
      benchmarkResult: window.benchmarkResult,
      status: BundleJobStatus.Passed,
    },
    loading: false,
    historyLoading: false,
    isLocal: true,
    history: window.histories,
  }

  return (
    <PackageResultContext.Provider value={packageResult}>
      <ReportContainer>
        <PackageDetail projectId={window.PROJECT_ID} packageId={window.PACKAGE_NAME} packageBundleId="local" />
      </ReportContainer>
    </PackageResultContext.Provider>
  )
}

function App() {
  const theme = useTheme()

  useEffect(() => {
    loadTheme(
      createTheme({
        defaultFontStyle: {
          fontFamily: theme.text.fontFamily,
        },
      }),
    )
  }, [theme])

  return (
    <MDXProvider components={MDXComponents}>
      <MemoryRouter>
        <Switch>
          <Route path="/" exact={true} component={PackageReportContainer} />
        </Switch>
      </MemoryRouter>
    </MDXProvider>
  )
}

createRoot(document.getElementById('app')!).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>,
)
