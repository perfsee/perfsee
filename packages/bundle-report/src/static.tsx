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
import { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Switch, Route, MemoryRouter, useLocation, useHistory } from 'react-router'
import { Link } from 'react-router-dom'

import { MDXComponents } from '@perfsee/components'
import { ThemeProvider } from '@perfsee/dls'
import { AssetInfo, ModuleReasons, ModuleTreeNode, diffBundleResult } from '@perfsee/shared'

import { PackageTraceContext } from './bundle-detail/context'
import { RouterContext } from './router-context'

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

const getAssetContent = (asset: AssetInfo) => {
  return Promise.resolve((window.bundleContent as ModuleTreeNode[]).filter((node) => node.name === asset.name))
}

const getModuleReasons = () => {
  return Promise.resolve(window.bundleModuleReasons as ModuleReasons)
}

function BundleReportContainer() {
  const bundleDiff = diffBundleResult(window.bundleReport)
  const [packageTrace, setPackageTrace] = useState<number | null>(null)
  const contextValue = useMemo(() => {
    return {
      ref: packageTrace,
      setRef: (ref: number | null) => setPackageTrace(ref),
    }
  }, [packageTrace])
  const location = useLocation()
  const history = useHistory()

  return (
    <ReportContainer>
      <RouterContext.Provider value={{ location, history, Link }}>
        <PackageTraceContext.Provider value={contextValue}>
          <BundleReport
            artifact={window.artifact}
            diff={bundleDiff}
            contentLink="/content"
            getAssetContent={getAssetContent}
            getModuleReasons={window.bundleModuleReasons && getModuleReasons}
          />
        </PackageTraceContext.Provider>
      </RouterContext.Provider>
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
      <MemoryRouter>
        <Switch>
          <Route path="/" exact={true} component={BundleReportContainer} />
          <Route path="/content" exact={true} component={BundleContentContainer} />
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
