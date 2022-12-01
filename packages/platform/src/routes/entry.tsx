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

import { useTheme } from '@emotion/react'
import { loadTheme, Spinner, SpinnerSize } from '@fluentui/react'
import { createTheme } from '@fluentui/theme'
import { useModule } from '@sigi/react'
import { useEffect } from 'react'
import { useLocation } from 'react-router'

import { staticPath } from '@perfsee/shared/routes'

import { Notifications } from '../modules/components'
import { Header, Footer } from '../modules/layout'
import { GlobalModule } from '../modules/shared'

import { Routes } from './routes'
import { MainContainer, PageContainer } from './style'

export const Entry = () => {
  const [{ user, settings, loading }, dispatcher] = useModule(GlobalModule)
  const emotionTheme = useTheme()
  const theme = createTheme({
    defaultFontStyle: {
      fontFamily: emotionTheme.text.fontFamily,
    },
  })
  const location = useLocation()

  const isInIntroductionRoutes =
    location.pathname === staticPath.home || location.pathname.startsWith(staticPath.features.home)

  useEffect(() => {
    loadTheme(theme)
  }, [theme])

  useEffect(() => {
    dispatcher.init()
  }, [dispatcher])

  if (loading) {
    return <Spinner size={SpinnerSize.large} label="Loading..." />
  }

  return (
    <PageContainer>
      <Notifications />
      <MainContainer>
        {!isInIntroductionRoutes && <Header />}
        <Routes user={user} settings={settings} />
        <Footer isAdmin={user?.isAdmin} />
      </MainContainer>
    </PageContainer>
  )
}
