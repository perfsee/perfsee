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

import { INavLink, INavLinkGroup } from '@fluentui/react'
import { useCallback, useEffect, useMemo } from 'react'
import { useHistory, useParams } from 'react-router'

import { pathFactory, RouteTypes } from '@perfsee/shared/routes'

import { SecondaryNav } from '../layout'

interface NavProps {
  routeMap: Array<{ key: string; title: string; path: string }>
}

export function ExtensionNavigator({ routeMap }: NavProps) {
  const history = useHistory()

  const routeParams = useParams<RouteTypes['extensions']['part']>()
  useEffect(() => {
    if (!routeParams.part) {
      history.replace(routeMap[0].path)
    }
  }, [history, routeParams, routeMap])

  const onLinkClick = useCallback(
    (_: any, item?: INavLink) => {
      if (!item) {
        return
      }

      history.push(pathFactory.extensions.part({ part: item.key }))
    },
    [history],
  )
  const navGroups = useMemo<INavLinkGroup[]>(() => {
    return [
      {
        links: routeMap.map((route) => ({
          name: route.title,
          key: route.key,
          url: '',
        })),
      },
    ]
  }, [routeMap])

  return <SecondaryNav groups={navGroups} selectedKey={routeParams.part} onLinkClick={onLinkClick} />
}
