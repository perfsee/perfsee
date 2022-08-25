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

import { Stack, Spinner } from '@fluentui/react'
import { useModule } from '@sigi/react'
import dayjs from 'dayjs'
import { parse } from 'query-string'
import { useEffect, useCallback, useState } from 'react'
import { useHistory, useLocation } from 'react-router-dom'

import { DateTimePicker, SingleSelector, ContentCard } from '@perfsee/components'
import { pathFactory } from '@perfsee/shared/routes'

import { Breadcrumb } from '../components'
import { LinkButton } from '../lab/style'
import { useBreadcrumb, PropertyModule, useGenerateProjectRoute } from '../shared'

import { CompetitorMetricsChart } from './competitor-metrics'
import { CompetitorTable } from './competitor-table'
import { CompetitorModule } from './module'

export const Competitor = () => {
  const [{ reports }, dispatcher] = useModule(CompetitorModule)
  const [{ profiles, pages, environments }, { fetchPageRelation, fetchProperty }] = useModule(PropertyModule, {
    selector: (s) => ({
      profiles: s.profiles,
      pages: s.pages.filter((p) => s.pageRelationMap.get(p.id)?.competitorIds.length),
      environments: s.environments.filter((e) => !e.isCompetitor),
    }),
    dependencies: [],
  })

  const location = useLocation()
  const history = useHistory()
  const generateProjectRoute = useGenerateProjectRoute()

  const breadcrumbItems = useBreadcrumb({ competitorPage: true })

  const [pageId, setPageId] = useState<number>()
  const [envId, setEnvId] = useState<number>()
  const [profileId, setProfileId] = useState<number>()
  const tomorrow = dayjs().startOf('day').add(1, 'day')
  const [{ startTime, endTime }, setTime] = useState<{ startTime: Date; endTime: Date }>({
    startTime: tomorrow.subtract(15, 'day').toDate(),
    endTime: tomorrow.toDate(),
  })

  useEffect(() => {
    fetchProperty()
    fetchPageRelation()
  }, [fetchPageRelation, fetchProperty])

  useEffect(() => {
    const { page, profile, env } = parse(location.search)
    page && setPageId(Number(page))
    env && setEnvId(Number(env))
    profile && setProfileId(Number(profile))
  }, [location.search])

  // init profile
  useEffect(() => {
    if (profiles.length) {
      setProfileId((id) => id ?? profiles[0].id)
    }
  }, [profiles])

  // init page id
  useEffect(() => {
    if (pages.length) {
      setPageId((id) => id ?? pages[0].id)
    }
  }, [pages])

  // init env id
  useEffect(() => {
    if (environments.length) {
      setEnvId((id) => id ?? environments[0].id)
    }
  }, [environments])

  useEffect(() => {
    if (startTime && endTime && profileId && pageId && envId) {
      dispatcher.getAllAggregatedSnapshots({
        pageId,
        profileId,
        envId,
        withCompetitor: true,
        from: startTime.toISOString(),
        to: endTime.toISOString(),
      })
    }
  }, [dispatcher, endTime, envId, pageId, profileId, startTime])

  useEffect(() => {
    return dispatcher.reset
  }, [dispatcher])

  const onChange = useCallback(
    (key: string, id: number) => {
      const query = {
        page: pageId,
        profile: profileId,
        env: envId,
        [key]: id,
      }
      const link = generateProjectRoute(pathFactory.project.competitor.home, {}, query)
      history.push(link)
    },
    [envId, generateProjectRoute, history, pageId, profileId],
  )

  const onPageIdChange = useCallback((id: number) => onChange('page', id), [onChange])

  const onProfileIdChange = useCallback((id: number) => onChange('profile', id), [onChange])

  const onEnvIdChange = useCallback((id: number) => onChange('env', id), [onChange])

  const onSelectStartTime = useCallback((date: Date) => {
    setTime((oldValue) => {
      if (date >= oldValue.endTime) {
        return { startTime: date, endTime: dayjs(date).add(1, 'day').toDate() }
      }
      return { startTime: date, endTime: oldValue.endTime }
    })
  }, [])

  const onSelectEndTime = useCallback((date: Date) => {
    setTime((oldValue) => ({ endTime: date, startTime: oldValue.startTime }))
  }, [])

  if (!profiles.length || !profileId) {
    return null
  }

  if (!pages.length) {
    const link = generateProjectRoute(pathFactory.project.settings, { settingName: 'pages' })
    return (
      <>
        <Breadcrumb items={breadcrumbItems} />
        <Stack horizontalAlign="center">
          <LinkButton to={link}>Create a competitor page first</LinkButton>
        </Stack>
      </>
    )
  }

  return (
    <Stack tokens={{ childrenGap: 6 }}>
      <Breadcrumb items={breadcrumbItems} />
      <ContentCard>
        <Stack horizontal={true} verticalAlign="center" tokens={{ childrenGap: 8 }}>
          <SingleSelector options={pages} id={pageId} onChange={onPageIdChange} />
          <SingleSelector isFirst={true} id={profileId} options={profiles} onChange={onProfileIdChange} />
          <SingleSelector isFirst={true} id={envId} options={environments} onChange={onEnvIdChange} />
          <DateTimePicker value={startTime} maxDate={tomorrow.toDate()} onChange={onSelectStartTime} />
          <b>-</b>
          <DateTimePicker value={endTime} minDate={startTime} onChange={onSelectEndTime} />
          <h4>{dayjs(endTime).diff(startTime, 'day')} Day(s)</h4>
        </Stack>
        {!reports ? (
          <Spinner styles={{ root: { marginTop: '50px' } }} />
        ) : (
          <>
            {pageId && <CompetitorTable reports={reports} pageId={pageId} />}
            <CompetitorMetricsChart reports={reports} />
          </>
        )}
      </ContentCard>
    </Stack>
  )
}
