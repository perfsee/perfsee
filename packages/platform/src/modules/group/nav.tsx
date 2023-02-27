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

import { Pivot, PivotItem } from '@fluentui/react'
import { useModuleState } from '@sigi/react'
import { parse, stringifyUrl } from 'query-string'
import { useCallback, useEffect } from 'react'
import { useHistory, useParams } from 'react-router'

import { Permission } from '@perfsee/schema'
import { pathFactory, RouteTypes } from '@perfsee/shared/routes'

import { GroupModule } from '../shared'

import { NavContainer } from './styled'

interface NavProps {
  routeMap: Array<{ key: string; title: string; path: string }>
}

export function GroupNavigator({ routeMap }: NavProps) {
  const history = useHistory()

  const group = useModuleState(GroupModule, {
    selector: (state) => state.group,
    dependencies: [],
  })
  const isAdminUser = group?.userPermission.includes(Permission.Admin) ?? false

  const routeParams = useParams<RouteTypes['group']['part']>()
  useEffect(() => {
    if (!routeParams.part) {
      history.replace(routeMap[0].path)
    }
  }, [history, routeParams, routeMap])

  const onLinkClick = useCallback(
    (item?: PivotItem) => {
      if (!item) {
        return
      }

      const query = parse(history.location.search)

      history.push(
        stringifyUrl({
          url: pathFactory.group.part({
            part: item.props.itemKey,
            groupId: routeParams.groupId,
          }),
          query,
        }),
      )
    },
    [history, routeParams.groupId],
  )

  return (
    <NavContainer>
      <Pivot onLinkClick={onLinkClick} selectedKey={routeParams.part} styles={{ root: { height: '100%' } }}>
        {routeMap.map(({ title, key }) => {
          if (key !== 'settings' || isAdminUser) {
            return <PivotItem key={key} itemKey={key} headerText={title} itemIcon={key} />
          }
        })}
      </Pivot>
    </NavContainer>
  )
}
