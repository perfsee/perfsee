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

import { css, useTheme } from '@emotion/react'
import { Stack, Icon, TooltipHost, Text } from '@fluentui/react'
import { useModule, useModuleState } from '@sigi/react'
import { useEffect } from 'react'

import { BodyContainer } from '@perfsee/components'

import { GlobalModule } from '../shared'

import { StatusModule } from './status.module'
import { HealthCategoryItem } from './style'

export const StatusPage = () => {
  const { user } = useModuleState(GlobalModule)

  if (!user) {
    return null
  }

  return (
    <BodyContainer>
      <Stack styles={{ root: { width: '100%' } }} tokens={{ childrenGap: '8px', padding: '16px 0' }}>
        <h2>System</h2>
        <SystemHealth />
        <h2>Pending Jobs</h2>
        <PendingJobs />
      </Stack>
    </BodyContainer>
  )
}

const SystemHealth = () => {
  const theme = useTheme()
  const [state, dispatcher] = useModule(StatusModule, {
    selector: (state) => state.health,
    dependencies: [],
  })

  useEffect(() => {
    dispatcher.fetchHealthStatus()
  }, [dispatcher])

  if (!state) {
    return <Icon iconName="loading" />
  }
  const categories = Object.entries(state).map(([category, stat]) => {
    const icon = (
      <Icon
        css={css({
          fontSize: '20px',
          lineHeight: '20px',
          svg: {
            fill: stat.status === 'up' ? theme.colors.success : theme.colors.error,
          },
        })}
        iconName={stat.status === 'up' ? 'completed' : 'errorBadge'}
      />
    )
    const tooltipId = `health-down-${category}`
    return (
      <HealthCategoryItem key={category}>
        <Stack>
          <h3>{category}</h3>
          <span
            css={css({
              color: stat.status === 'up' ? theme.text.colorSecondary : theme.colors.warning,
              fontSize: '12px',
            })}
          >
            {stat.status === 'up' ? (
              'Up'
            ) : (
              <>
                Down{' '}
                <TooltipHost content={stat.message} id={tooltipId}>
                  <Icon css={css({ marginTop: '1px' })} iconName="info" aria-describedby={tooltipId} />
                </TooltipHost>
              </>
            )}
          </span>
        </Stack>
        {icon}
      </HealthCategoryItem>
    )
  })

  return (
    <Stack
      styles={{ inner: { width: '100%', height: 'auto' } }}
      horizontal
      wrap
      horizontalAlign="start"
      verticalAlign="start"
    >
      {categories}
    </Stack>
  )
}

const PendingJobs = () => {
  const theme = useTheme()
  const [state, dispatcher] = useModule(StatusModule, {
    selector: (state) => state.pendingJobsAggregation,
    dependencies: [],
  })

  useEffect(() => {
    dispatcher.fetchPendingJobsAggregation()
  }, [dispatcher])

  if (!state) {
    return <Icon iconName="loading" />
  }

  return (
    <Stack
      styles={{ inner: { width: '100%', height: 'auto' } }}
      horizontal
      wrap
      horizontalAlign="start"
      verticalAlign="start"
    >
      {state.map(({ jobType, count }) => (
        <HealthCategoryItem key={jobType}>
          <h3>{jobType}</h3>
          <Text variant="xLarge" styles={{ root: { color: theme.text.colorSecondary, marginLeft: 20 } }}>
            {count}
          </Text>
        </HealthCategoryItem>
      ))}
    </Stack>
  )
}
