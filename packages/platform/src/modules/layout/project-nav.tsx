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

import styled from '@emotion/styled'
import { DirectionalHint, Pivot, PivotItem } from '@fluentui/react'
import { useModuleState } from '@sigi/react'
import { useCallback } from 'react'
import { useHistory, useParams } from 'react-router'

import { TeachingBubbleHost } from '@perfsee/components'
import { Permission } from '@perfsee/schema'
import { pathFactory, RouteTypes } from '@perfsee/shared/routes'

import { ProjectModule } from '../shared'

export enum NavItem {
  Home = 'home',
  Bundle = 'bundle',
  Lab = 'lab',
  Source = 'source',
  Competitor = 'competitor',
  Settings = 'settings',
}

export const NavContainer = styled.div(({ theme }) => ({
  height: '44px',
  position: 'sticky',
  top: theme.layout.headerHeight,
  zIndex: 3,
  backgroundColor: theme.colors.white,
  padding: `0 ${theme.layout.mainPadding}`,
}))

export const ProjectNav = () => {
  const history = useHistory()
  const routeParams = useParams<RouteTypes['project']['feature']>()

  const project = useModuleState(ProjectModule, {
    selector: (state) => state.project,
    dependencies: [],
  })
  const isAdminUser = project?.userPermission.includes(Permission.Admin) ?? false

  const handleLinkClick = useCallback(
    (item?: PivotItem) => {
      if (!item || routeParams.feature === item.props.itemKey) {
        return
      }

      history.push(pathFactory.project.feature({ ...routeParams, feature: item.props.itemKey }))
    },
    [history, routeParams],
  )

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
      >
        <Pivot onLinkClick={handleLinkClick} selectedKey={routeParams.feature} styles={{ root: { height: '100%' } }}>
          {Object.entries(NavItem).map(
            ([key, val]) =>
              (val !== NavItem.Settings || isAdminUser) && (
                <PivotItem key={key} itemKey={val} headerText={key} itemIcon={val} />
              ),
          )}
        </Pivot>
      </TeachingBubbleHost>
    </NavContainer>
  )
}
