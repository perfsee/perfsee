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
import { Switch, Route } from 'react-router'
import { BrowserRouter } from 'react-router-dom'

import { MDXComponents } from '@perfsee/components'
import { ThemeProvider } from '@perfsee/dls'
import { diffBundleResult } from '@perfsee/shared'

import { BundleReport, BundleContent } from './index'

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

const ContentContainer = styled('div')({
  margin: '0 48px',
})

function BundleReportContainer() {
  const bundleDiff = diffBundleResult(window.bundleReport)
  return (
    <ReportContainer>
      <BundleReport artifact={window.artifact} diff={bundleDiff} contentLink="/content" />
    </ReportContainer>
  )
}

function BundleContentContainer() {
  return (
    <ContentContainer>
      <BundleContent content={window.bundleContent} />
    </ContentContainer>
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
      <BrowserRouter>
        <Switch>
          <Route path="/" exact={true} component={BundleReportContainer} />
          <Route path="/content" exact={true} component={BundleContentContainer} />
        </Switch>
      </BrowserRouter>
    </MDXProvider>
  )
}

createRoot(document.getElementById('app')!).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>,
)
