import styled from '@emotion/styled'
import { INavLink, INavLinkGroup, Nav } from '@fluentui/react'
import { useCallback, useEffect, useMemo } from 'react'
import { useHistory, useParams } from 'react-router'

import { pathFactory, RouteTypes } from '@perfsee/shared/routes'

const NavContainer = styled.div({})

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
  return (
    <NavContainer>
      <Nav
        groups={navGroups}
        selectedKey={routeParams.part}
        onLinkClick={onLinkClick}
        styles={{
          root: { width: '200px' },
          link: { paddingLeft: 10, paddingRight: 20, color: 'unset' },
          groupContent: { marginBottom: 0 },
          linkText: { margin: '0 4px' },
        }}
      />
    </NavContainer>
  )
}
