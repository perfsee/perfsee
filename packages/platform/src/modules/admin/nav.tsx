import { INavLink, INavLinkGroup } from '@fluentui/react'
import { useCallback, useEffect, useMemo } from 'react'
import { useHistory, useParams } from 'react-router'

import { pathFactory, RouteTypes } from '@perfsee/shared/routes'

import { SecondaryNav } from '../layout'

interface NavProps {
  routeMap: Array<{ key: string; title: string; path: string }>
}

export function AdminNavigator({ routeMap }: NavProps) {
  const history = useHistory()

  const routeParams = useParams<RouteTypes['admin']['part']>()
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

      history.push(pathFactory.admin.part({ part: item.key }))
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
