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

import { IconButton, SelectionMode, Stack } from '@fluentui/react'
import { useModule } from '@sigi/react'
import { useEffect, FC, useMemo } from 'react'
import { Route, Switch, useHistory, useParams } from 'react-router'

import {
  BodyContainer,
  ContentCard,
  Table,
  TableColumnProps,
  TooltipWithEllipsis,
  formatMDLink,
} from '@perfsee/components'
import { RouteTypes, pathFactory, staticPath } from '@perfsee/shared/routes'

import { RunnerScriptManager } from '../admin/runner-scripts'

import { ExtensionType, ExtensionModule, ExtensionScript } from './module'
import { ExtensionNavigator } from './nav'

/* eslint-disable react/jsx-no-bind */
const navigators = [
  {
    key: 'bundle-audits',
    title: 'Bundle Audits',
    path: staticPath.extensions.bundleAudits.home,
    children: (
      <Switch>
        <Route
          exact
          path={staticPath.extensions.bundleAudits.home}
          component={() => <ExtensionManager type={ExtensionType.BundleAudit} />}
        />
        <Route
          exact
          path={staticPath.extensions.bundleAudits.detail}
          component={() => {
            const id = useParams<RouteTypes['extensions']['bundleAudits']['detail']>().auditId
            return <RunnerScriptManager jobType={`${ExtensionType.BundleAudit}.${id}`} hideHeader />
          }}
        />
      </Switch>
    ),
  },
  {
    key: 'lab-audits',
    title: 'Lab Audits',
    path: staticPath.extensions.labAudits.home,
    children: (
      <Switch>
        <Route
          exact
          path={staticPath.extensions.labAudits.home}
          component={() => <ExtensionManager type={ExtensionType.LabAudit} />}
        />
        <Route
          exact
          path={staticPath.extensions.labAudits.detail}
          component={() => {
            const id = useParams<RouteTypes['extensions']['labAudits']['detail']>().auditId
            return <RunnerScriptManager jobType={`${ExtensionType.LabAudit}.${id}`} hideHeader />
          }}
        />
      </Switch>
    ),
  },
]

const typeToRouters = {
  [ExtensionType.BundleAudit]: 'bundleAudits',
  [ExtensionType.LabAudit]: 'labAudits',
}

export const Extensions = () => {
  return (
    <BodyContainer>
      <Stack horizontal>
        <ExtensionNavigator routeMap={navigators} />
        <Stack.Item grow>
          <Switch>
            {navigators.map(({ path, children }) => (
              // eslint-disable-next-line
              <Route key={path} path={path} children={children} />
            ))}
          </Switch>
        </Stack.Item>
      </Stack>
    </BodyContainer>
  )
}

const getExtensionId = (script: ExtensionScript, type: ExtensionType) => {
  const split = script.jobType.split(type)
  const name = split[1] || split[0]
  if (name.startsWith('.')) {
    return name.split('.')[1]
  }
  return name
}

interface ExtensionManagerProps {
  type: ExtensionType
}
const ExtensionManager: FC<ExtensionManagerProps> = ({ type = ExtensionType.BundleAudit }) => {
  const [{ extensions }, dispatcher] = useModule(ExtensionModule)
  useEffect(() => {
    dispatcher.fetchByType(type)
    return dispatcher.reset
  }, [dispatcher, type])

  const history = useHistory()

  const scriptTableColumns: TableColumnProps<ExtensionScript>[] = useMemo(() => {
    return [
      {
        key: 'id',
        name: 'ID',
        minWidth: 80,
        maxWidth: 120,
        onRender: (script) => {
          return getExtensionId(script, type)
        },
      },
      {
        key: 'description',
        name: 'Description',
        minWidth: 200,
        onRender: (script) => {
          const content = formatMDLink(script.description || undefined) || undefined
          return <TooltipWithEllipsis tooltipContent={content}>{content}</TooltipWithEllipsis>
        },
      },
      {
        key: 'detail',
        name: 'Detail',
        minWidth: 50,
        onRender: (script) => {
          const id = getExtensionId(script, type)
          const onClickDetail = () => {
            history.push(
              pathFactory.extensions[typeToRouters[type] || 'bundleAudits'].detail({
                auditId: id,
              }),
            )
          }
          return (
            <Stack horizontal>
              <IconButton onClick={onClickDetail} iconProps={{ iconName: 'DoubleRightOutlined' }} />
            </Stack>
          )
        },
      },
    ]
  }, [type, history])

  return (
    <ContentCard
      onRenderHeader={() => {
        return <Stack>Extensions</Stack>
      }}
    >
      <Table selectionMode={SelectionMode.none} items={extensions} columns={scriptTableColumns} />
    </ContentCard>
  )
}
