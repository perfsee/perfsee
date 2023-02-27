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

import { Spinner, SpinnerSize, Stack } from '@fluentui/react'
import { useModule } from '@sigi/react'
import dayjs from 'dayjs'
import { useCallback, useMemo } from 'react'

import { BodyContainer, NotFound, useQueryString, DateRangeSelector } from '@perfsee/components'

import { GroupModule } from '../../shared/group.module'

import { Charts } from './charts'

export function Analysis() {
  const [{ group, loading }] = useModule(GroupModule)

  const [{ startTime = dayjs().subtract(2, 'weeks').unix(), endTime = dayjs().unix() }, updateQueryString] =
    useQueryString<{ startTime: number; endTime: number }>()
  const startDate = useMemo(() => dayjs.unix(startTime).toDate(), [startTime])
  const endDate = useMemo(() => dayjs.unix(endTime).toDate(), [endTime])

  const handleStartDateSelect = useCallback(
    (date?: Date | null) => {
      if (date) {
        updateQueryString({ startTime: dayjs(date).unix() })
      }
    },
    [updateQueryString],
  )

  const handleEndDateSelect = useCallback(
    (date?: Date | null) => {
      if (date) {
        updateQueryString({ endTime: dayjs(date).unix() })
      }
    },
    [updateQueryString],
  )

  if (loading) {
    return <Spinner label="Loading group..." size={SpinnerSize.large} styles={{ root: { marginTop: 40 } }} />
  }

  if (!group) {
    return <NotFound />
  }

  return (
    <BodyContainer>
      <Stack horizontal verticalAlign="center" horizontalAlign="space-between">
        <h3>{group.id}</h3>
        <Stack horizontal>
          <DateRangeSelector
            startDate={startDate}
            endDate={endDate}
            onStartDateChanged={handleStartDateSelect}
            onEndDateChanged={handleEndDateSelect}
          />
        </Stack>
      </Stack>
      <Charts groupId={group.id} startTime={startTime} endTime={endTime} />
    </BodyContainer>
  )
}
