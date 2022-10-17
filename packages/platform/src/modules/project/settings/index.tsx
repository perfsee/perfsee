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

import { Stack, IStackTokens, Pivot, PivotItem } from '@fluentui/react'
import { useDispatchers } from '@sigi/react'
import { useEffect, useCallback, useMemo } from 'react'
import { useParams, useHistory } from 'react-router-dom'

import { ContentCard } from '@perfsee/components'
import { pathFactory, RouteTypes } from '@perfsee/shared/routes'

import { Breadcrumb } from '../../components'
import { useBreadcrumb, PropertyModule, useGenerateProjectRoute } from '../../shared'

import { SettingsBasic } from './settings-basic'
import { SettingsE2e } from './settings-e2e'
import { SettingsEnvironments } from './settings-environments'
import { SettingsPages } from './settings-pages'
import { SettingsPermission } from './settings-permission'
import { SettingsProfiles } from './settings-profiles'
import { SettingsSchedule } from './settings-schedule'
import { TimeUsage } from './settings-usage'

const stackTokens: IStackTokens = {
  childrenGap: 20,
}

enum TabEnum {
  Basic = 'basic',
  Permission = 'permission',
  Schedule = 'schedule',
  Pages = 'pages',
  Profiles = 'profiles',
  Environments = 'environments',
  Usage = 'usage',
  E2E = 'e2e',
}

export const Settings = () => {
  const breadcrumbItems = useBreadcrumb({ settingsPage: true })
  const dispatcher = useDispatchers(PropertyModule)

  const history = useHistory()
  const { settingName } = useParams<RouteTypes['project']['settings']>()
  const generateProjectRoute = useGenerateProjectRoute()

  useEffect(() => {
    dispatcher.fetchSettingProperty()
    dispatcher.fetchProperty()
  }, [dispatcher])

  const onLinkClick = useCallback(
    (item?: PivotItem) => {
      const path = generateProjectRoute(pathFactory.project.settings, { settingName: item?.props.itemKey ?? 'basic' })
      history.push(path)
    },
    [generateProjectRoute, history],
  )

  const content = useMemo(() => {
    switch (settingName) {
      case TabEnum.Basic:
        return <SettingsBasic />
      case TabEnum.Permission:
        return <SettingsPermission />
      case TabEnum.Schedule:
        return <SettingsSchedule />
      case TabEnum.Pages:
        return <SettingsPages />
      case TabEnum.Profiles:
        return <SettingsProfiles />
      case TabEnum.Environments:
        return <SettingsEnvironments />
      case TabEnum.Usage:
        return <TimeUsage />
      case TabEnum.E2E:
        return <SettingsE2e />
      default:
        return <SettingsBasic />
    }
  }, [settingName])

  const onRenderHeader = useCallback(() => {
    return (
      <Stack horizontal horizontalAlign="space-between" verticalAlign="center" styles={{ root: { flexGrow: 1 } }}>
        <span>Settings</span>
        <Pivot selectedKey={settingName ?? 'basic'} onLinkClick={onLinkClick}>
          <PivotItem itemKey={TabEnum.Basic} headerText="Basic" />
          <PivotItem itemKey={TabEnum.Permission} headerText="Permission" />
          <PivotItem itemKey={TabEnum.Schedule} headerText="Schedule" />
          <PivotItem itemKey={TabEnum.Pages} headerText="Pages" />
          {/* hidden e2e settings */}
          {settingName === TabEnum.E2E && <PivotItem itemKey={TabEnum.E2E} headerText="E2E" />}
          <PivotItem itemKey={TabEnum.Profiles} headerText="Profiles" />
          <PivotItem itemKey={TabEnum.Environments} headerText="Environments" />
          <PivotItem itemKey={TabEnum.Usage} headerText="Usage" />
        </Pivot>
      </Stack>
    )
  }, [onLinkClick, settingName])

  useEffect(() => {
    if (!settingName) {
      history.push(generateProjectRoute(pathFactory.project.settings, { settingName: 'basic' }))
    }
  }, [generateProjectRoute, history, settingName])

  return (
    <div style={{ padding: '0 20px' }}>
      <Breadcrumb items={breadcrumbItems} />
      <ContentCard onRenderHeader={onRenderHeader}>
        <Stack tokens={stackTokens}>{content}</Stack>
      </ContentCard>
    </div>
  )
}
