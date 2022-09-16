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

import { useModuleState } from '@sigi/react'
import { useCallback } from 'react'
import { useHistory } from 'react-router'

import { staticPath } from '@perfsee/shared/routes'

import { UserModule } from '../shared'

import { HeaderMenusContainer, HeaderTitleContainer, Logo, Title } from './header.style'
import LogoUrl from './logo.png'

export const HeaderLogo = () => {
  const loggedIn = useModuleState(UserModule, {
    selector: (s) => !!s.user,
    dependencies: [],
  })

  const history = useHistory()
  const toHomePage = useCallback(() => {
    history.push(loggedIn ? staticPath.projects : staticPath.home)
  }, [history, loggedIn])

  return (
    <HeaderMenusContainer>
      <Logo src={LogoUrl} alt="Perfsee" onClick={toHomePage} width="30" height="30" />
      <HeaderTitleContainer>
        <Title onClick={toHomePage}>Perfsee</Title>
      </HeaderTitleContainer>
    </HeaderMenusContainer>
  )
}
