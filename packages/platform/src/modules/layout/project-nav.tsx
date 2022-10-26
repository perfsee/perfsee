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

import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons'
import { DirectionalHint, INavLink, INavLinkGroup, Nav } from '@fluentui/react'
import { useModuleState } from '@sigi/react'
import { useState, useCallback, useMemo } from 'react'
import { useHistory, useParams } from 'react-router'

import { TeachingBubbleHost } from '@perfsee/components'
import { Permission } from '@perfsee/schema'
import { pathFactory, RouteTypes } from '@perfsee/shared/routes'

import { ProjectModule, useNavType } from '../shared'

import { NavItem } from './nav-items'
import { NavContainer, CollapseContainer } from './nav.style'

export const ProjectNav = () => {
  const history = useHistory()
  const routeParams = useParams<RouteTypes['project']['feature']>()

  const project = useModuleState(ProjectModule, {
    selector: (state) => state.project,
    dependencies: [],
  })
  const [navbarCollapsed, collapseNavbar, expandNavbar] = useNavType()

  const [selectedKey, setSelectedKey] = useState(routeParams.feature)

  const navItems = useMemo(() => {
    const isAdminUser = project?.userPermission.includes(Permission.Admin) ?? false

    const adminItems = isAdminUser
      ? [
          {
            key: 'Settings',
            val: 'settings',
          },
        ]
      : []

    const commonItems = Object.entries(NavItem).map(([key, val]) => ({ key, val }))

    return [...commonItems, ...adminItems]
  }, [project])

  const handleLinkClick = useCallback(
    (_: any, item?: INavLink) => {
      const selectedKey = item!.key

      if (!selectedKey || !navItems.some(({ val }) => val === selectedKey)) {
        return
      }

      setSelectedKey(selectedKey)
      history.push(pathFactory.project.feature({ ...routeParams, feature: selectedKey }))
    },
    [history, navItems, routeParams],
  )

  const toggleNavbarCollapsed = useCallback(() => {
    if (navbarCollapsed) {
      expandNavbar()
    } else {
      collapseNavbar()
    }
  }, [collapseNavbar, expandNavbar, navbarCollapsed])

  const navLinkGroups: INavLinkGroup[] = useMemo(() => {
    return [
      {
        links: navItems.map(({ key, val }) => ({
          name: navbarCollapsed ? '' : key,
          url: '',
          key: val,
          icon: val,
        })),
      },
    ]
  }, [navItems, navbarCollapsed])

  const navStyles = useMemo(
    () => ({
      root: { width: navbarCollapsed ? 'auto' : '200px' },
      link: { paddingLeft: 10, paddingRight: navbarCollapsed ? 10 : 20, color: 'unset' },
      groupContent: { marginBottom: 0 },
      linkText: { margin: navbarCollapsed ? 0 : '0 4px' },
    }),
    [navbarCollapsed],
  )

  if (routeParams.feature && selectedKey !== routeParams.feature) {
    setSelectedKey(routeParams.feature)
  }

  if (!project) {
    return null
  }

  return (
    <NavContainer>
      <TeachingBubbleHost
        teachingId="project-home-modules"
        headline="Switch Feature Modules"
        body="Perfsee is split into multiple functional modules, click here to switch between them."
        directional={DirectionalHint.bottomCenter}
        delay={500}
        visible={selectedKey === 'home'}
      >
        <Nav groups={navLinkGroups} selectedKey={selectedKey} onLinkClick={handleLinkClick} styles={navStyles} />
      </TeachingBubbleHost>
      <CollapseContainer onClick={toggleNavbarCollapsed}>
        {navbarCollapsed ? (
          <MenuUnfoldOutlined />
        ) : (
          <>
            <MenuFoldOutlined />
            <span>Collapse sidebar</span>
          </>
        )}
      </CollapseContainer>
    </NavContainer>
  )
}
