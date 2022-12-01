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

import { Stack, INavLinkGroup, INavLink } from '@fluentui/react'
import { useDispatchers } from '@sigi/react'
import { useEffect, useCallback, useMemo } from 'react'
import { useParams, useHistory } from 'react-router-dom'

import { ContentCard } from '@perfsee/components'
import { pathFactory, RouteTypes } from '@perfsee/shared/routes'

import { SecondaryNav } from '../../layout'
import { PropertyModule } from '../../shared'

import { SettingsBasic } from './settings-basic'
import { SettingsE2e } from './settings-e2e'
import { SettingsEnvironments } from './settings-environments'
import { SettingsPages } from './settings-pages'
import { SettingsPermission } from './settings-permission'
import { SettingsProfiles } from './settings-profiles'
import { SettingsSchedule } from './settings-schedule'
import { ProjectUsage } from './settings-usage'

enum TabEnum {
  General = 'basic',
  Permission = 'permission',
  Schedule = 'schedule',
  Pages = 'pages',
  Profiles = 'profiles',
  Environments = 'environments',
  Usage = 'usage',
  E2E = 'e2e',
}

export const Settings = () => {
  const dispatcher = useDispatchers(PropertyModule)

  const history = useHistory()
  const { projectId, settingName } = useParams<RouteTypes['project']['settings']>()

  const navGroups = useMemo<INavLinkGroup[]>(
    () => [
      {
        links: Object.entries(TabEnum)
          .map(([key, val]) => ({
            name: key,
            url: '',
            key: val,
          }))
          // hide e2e tab temporarily
          .filter(({ key }) => key !== TabEnum.E2E),
      },
    ],
    [],
  )

  useEffect(() => {
    dispatcher.fetchSettingProperty()
    dispatcher.fetchProperty()
  }, [dispatcher])

  const onLinkClick = useCallback(
    (_: any, item?: INavLink) => {
      if (!item?.key) {
        return
      }
      if (item.key !== settingName) {
        history.push(pathFactory.project.settings({ projectId, settingName: item.key }))
      }
    },
    [settingName, projectId, history],
  )

  const content = useMemo(() => {
    switch (settingName) {
      case TabEnum.General:
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
        return <ProjectUsage />
      case TabEnum.E2E:
        return <SettingsE2e />
      default:
        return <SettingsBasic />
    }
  }, [settingName])

  useEffect(() => {
    if (!settingName) {
      history.replace(pathFactory.project.settings({ projectId, settingName: TabEnum.General }))
    }
  }, [history, settingName, projectId])

  return (
    <Stack horizontal>
      <SecondaryNav groups={navGroups} selectedKey={settingName} onLinkClick={onLinkClick} />
      <Stack.Item grow>
        <ContentCard>{content}</ContentCard>
      </Stack.Item>
    </Stack>
  )
}
