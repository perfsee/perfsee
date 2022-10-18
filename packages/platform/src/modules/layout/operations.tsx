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

import { DirectionalHint, HoverCard, HoverCardType, Icon, IPlainCardProps, Stack } from '@fluentui/react'
import { useModuleState } from '@sigi/react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'

import { ForeignLink } from '@perfsee/components'
import { staticPath } from '@perfsee/shared/routes'

import { UserAvatar } from '../me/avatar'
import { GlobalModule } from '../shared'

import { HeaderOperatorContainer, HeaderOperatorSmallWrap, HeaderOperatorWrap, HoverCardWrap } from './header.style'

export const Operations = () => {
  const { loggedIn, isAdmin } = useModuleState(GlobalModule, {
    selector: (s) => ({
      loggedIn: !!s.user,
      isAdmin: s?.user?.isAdmin,
    }),
    dependencies: [],
  })

  const operations = useMemo(
    () => (
      <>
        {isAdmin && <Link to={staticPath.admin.home}>Admin</Link>}
        <ForeignLink href={staticPath.docs.home}>Docs</ForeignLink>
        {loggedIn && <a href={SERVER + `/auth/logout`}>Logout</a>}
      </>
    ),
    [loggedIn, isAdmin],
  )

  const cardProps = useMemo<IPlainCardProps>(
    () => ({
      onRenderPlainCard: () => {
        return (
          <HoverCardWrap>
            {loggedIn && <Link to={staticPath.me.home}>Settings</Link>}
            {operations}
          </HoverCardWrap>
        )
      },
      directionalHint: DirectionalHint.topCenter,
      calloutProps: {
        isBeakVisible: true,
      },
    }),
    [operations, loggedIn],
  )

  return (
    <HeaderOperatorWrap>
      <HeaderOperatorContainer>
        {operations}
        {loggedIn ? (
          <Link to={staticPath.me.home}>
            <UserAvatar />
          </Link>
        ) : (
          <>
            <Link to={staticPath.login}>Sign in</Link>
            <Link to={staticPath.register}>Register</Link>
          </>
        )}
      </HeaderOperatorContainer>
      <HeaderOperatorSmallWrap>
        <HoverCard plainCardProps={cardProps} type={HoverCardType.plain} instantOpenOnClick>
          <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 8 }}>
            {loggedIn && <UserAvatar />}
            <Icon iconName="ChevronDown" />
          </Stack>
        </HoverCard>
      </HeaderOperatorSmallWrap>
    </HeaderOperatorWrap>
  )
}
