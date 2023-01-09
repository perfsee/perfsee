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

import { css } from '@emotion/react'
import { DatePicker, Spinner, SpinnerSize, Stack } from '@fluentui/react'
import { useModule } from '@sigi/react'
import dayjs from 'dayjs'
import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router'

import { BodyContainer, NotFound } from '@perfsee/components'
import { RouteTypes } from '@perfsee/shared/routes'

import { OrganizationTable } from './organization-table'
import { OrganizationModule } from './organization.module'

export const OrganizationHome = () => {
  const { organizationId } = useParams<RouteTypes['organization']['home']>()

  const [{ organization, loading }, dispatcher] = useModule(OrganizationModule)
  const tomorrow = dayjs().startOf('day').add(1, 'day')
  const [{ startTime, endTime }, setTime] = useState<{ startTime: Date; endTime: Date }>({
    startTime: tomorrow.subtract(15, 'day').toDate(),
    endTime: tomorrow.toDate(),
  })

  const onSelectStartTime = useCallback((date?: Date | null) => {
    if (date) {
      setTime((oldValue) => {
        if (date >= oldValue.endTime) {
          return { startTime: date, endTime: dayjs(date).add(1, 'day').toDate() }
        }
        return { startTime: date, endTime: oldValue.endTime }
      })
    }
  }, [])

  const onSelectEndTime = useCallback((date?: Date | null) => {
    if (date) {
      setTime((oldValue) => ({ endTime: date, startTime: oldValue.startTime }))
    }
  }, [])

  useEffect(() => {
    if (organizationId) {
      dispatcher.getOrganization({ orgId: organizationId })
    }

    return dispatcher.reset
  }, [dispatcher, organizationId])

  useEffect(() => {
    if (organizationId && startTime && endTime) {
      dispatcher.getOrganizationUsage({
        id: organizationId,
        from: dayjs(startTime).toISOString(),
        to: dayjs(endTime).toISOString(),
      })
    }
  }, [dispatcher, endTime, organizationId, startTime])

  if (loading) {
    return <Spinner label="Loading organization..." size={SpinnerSize.large} styles={{ root: { marginTop: 40 } }} />
  }

  if (!organization) {
    return <NotFound />
  }

  return (
    <BodyContainer>
      <Stack horizontal verticalAlign="center" horizontalAlign="space-between">
        <h3>{organization.id}</h3>
        <Stack horizontal>
          <DatePicker value={startTime} maxDate={tomorrow.toDate()} onSelectDate={onSelectStartTime} />
          <b css={css({ padding: '6px 4px' })}> - </b>
          <DatePicker value={endTime} minDate={startTime} onSelectDate={onSelectEndTime} />
        </Stack>
      </Stack>
      <OrganizationTable />
    </BodyContainer>
  )
}
