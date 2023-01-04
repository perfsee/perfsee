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

import { Stack } from '@fluentui/react'
import { useDispatchers } from '@sigi/react'
import { useEffect } from 'react'
import { Redirect, Route, Switch, useParams } from 'react-router'

import { pathFactory, RouteTypes, staticPath } from '@perfsee/shared/routes'

import { GroupModule } from '../shared/group.module'

import { Analysis } from './analysis'
import { Home } from './home'
import { GroupNavigator } from './nav'
import { Settings } from './settings'

const navigators = [
  {
    key: 'home',
    title: 'Home',
    path: staticPath.group.home,
    component: Home,
  },
  {
    key: 'analysis',
    title: 'Analysis',
    path: staticPath.group.analysis,
    component: Analysis,
  },
  {
    key: 'settings',
    title: 'Settings',
    path: staticPath.group.settings,
    component: Settings,
  },
]

export function GroupRoutes() {
  const { groupId, part } = useParams<RouteTypes['group']['part']>()
  const dispatcher = useDispatchers(GroupModule)

  useEffect(() => {
    if (groupId) {
      dispatcher.getGroup({ groupId: groupId })
    }

    return dispatcher.reset
  }, [dispatcher, groupId])

  if (!part) {
    return <Redirect to={pathFactory.group.home({ groupId })} push={false} />
  }

  return (
    <>
      <GroupNavigator routeMap={navigators} />
      <Stack.Item grow>
        <Switch>
          {navigators.map(({ path, component }) => (
            <Route key={path} path={path} component={component} />
          ))}
        </Switch>
      </Stack.Item>
    </>
  )
}
