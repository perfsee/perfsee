import styled from '@emotion/styled'
import { Route, Switch } from 'react-router'

import { ContentCard } from '@perfsee/components'
import { staticPath } from '@perfsee/shared/routes'

import { StatusPage } from '../status'

import { Applications } from './applications'
import { AdminNavigator } from './nav'
import { RunnerScriptManager } from './runner-scripts'
import { Runners } from './runners'
import { Settings } from './settings'
import { UsagePacks } from './usage-packs'

const Main = styled.div({
  minHeight: '100%',
  maxWidth: '1280px',
  margin: '0 auto',
  display: 'flex',
  padding: '20px',
  '> :not(:last-child)': {
    marginRight: '20px',
  },
})

const Content = styled.div({
  flex: 1,
})

const navigators = [
  {
    key: 'settings',
    title: 'Settings',
    path: staticPath.admin.settings,
    component: Settings,
  },
  {
    key: 'runners',
    title: 'Runners',
    path: staticPath.admin.runners,
    component: Runners,
  },
  {
    key: 'runner-scripts',
    title: 'Runners Scripts',
    path: staticPath.admin.scripts,
    component: RunnerScriptManager,
  },
  {
    key: 'applications',
    title: 'Applications',
    path: staticPath.admin.applications,
    component: Applications,
  },
  {
    key: 'status',
    title: 'Status',
    path: staticPath.admin.status,
    component: () => (
      <ContentCard>
        <StatusPage />
      </ContentCard>
    ),
  },
  {
    key: 'usage-packs',
    title: 'Usage Packs',
    path: staticPath.admin.usagePacks,
    component: UsagePacks,
  },
]

export function AdminRoutes() {
  return (
    <Main>
      <AdminNavigator routeMap={navigators} />
      <Content>
        <Switch>
          {navigators.map(({ path, component }) => (
            <Route key={path} path={path} component={component} />
          ))}
        </Switch>
      </Content>
    </Main>
  )
}
