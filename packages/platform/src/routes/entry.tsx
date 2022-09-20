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
import { useRouteMatch } from 'react-router'

import { staticPath } from '@perfsee/shared/routes'

import { Notifications } from '../modules/components'
import { Header, Footer } from '../modules/layout'
import { UserModule } from '../modules/shared/user.module'

import { Routes } from './routes'
import { MainContainer, PageContainer } from './style'

export const Entry = () => {
  const [{ user, userLoading }, dispatcher] = useModule(UserModule, {
    selector: (state) => ({ user: state.user, userLoading: state.userLoading }),
    dependencies: [],
  })
  const emotionTheme = useTheme()
  const theme = createTheme({
    defaultFontStyle: {
      fontFamily: emotionTheme.text.fontFamily,
    },
  })

  useEffect(() => {
    loadTheme(theme)
  }, [theme])

  useEffect(() => {
    dispatcher.getUser()
  }, [dispatcher])

  const inProjectFeaturePages = !!useRouteMatch(staticPath.project.feature)
  const isHomePages = !!useRouteMatch({ path: staticPath.home, exact: true })
  const isFeaturePages = !!useRouteMatch({ path: staticPath.features.home, exact: false })

  if (userLoading) {
    return <Spinner size={SpinnerSize.large} label="Loading..." />
  }

  return (
    <PageContainer>
      {!(isHomePages || isFeaturePages) && <Header narrow={!inProjectFeaturePages} />}
      <MainContainer>
        <Routes user={user} />
        {!inProjectFeaturePages && <Footer isAdmin={user?.isAdmin} />}
      </MainContainer>
      <Notifications />
    </PageContainer>
  )
}
