import { ClockCircleOutlined, CloudServerOutlined, NumberOutlined } from '@ant-design/icons'
import { Stack, Text } from '@fluentui/react'
import { useModule } from '@sigi/react'
import dayjs from 'dayjs'
import { useEffect, useMemo } from 'react'

import { Progress } from '@perfsee/components'
import { formatTime } from '@perfsee/platform/common'

import { SettingsUsageModule } from './module'
import {
  ProgressValue,
  ProgressWrapper,
  UsageBlock,
  UsageBlockIcon,
  UsageBlockInfo,
  UsageBlockTitle,
  UsagePackContent,
  UsagePackHeader,
  UsagePackIcon,
  UsagePackWrapper,
  UsageTableWrapper,
} from './style'

export const UsageTable = () => {
  const [{ usage, usagePack }, { fetchUsage }] = useModule(SettingsUsageModule)

  const currentMonth = dayjs().format('YYYY/MM')

  const [countPercent, countUsage] = useMemo(() => {
    if (usagePack?.jobCountMonthly === -1) {
      return [0.5, `${usage.jobCount}/Unlimited`]
    }

    const countMax = usagePack?.jobCountMonthly ?? usage.jobCount
    const percent = usage.jobCount / countMax
    const tooltip = `${usage.jobCount}/${countMax}`

    return [percent, tooltip]
  }, [usage.jobCount, usagePack?.jobCountMonthly])

  const [durationPercent, durationUsage] = useMemo(() => {
    if (usagePack?.jobDurationMonthly === -1) {
      return [0.5, `${usage.jobDuration} mins/Unlimited`]
    }

    const durationMax = usagePack?.jobDurationMonthly ?? usage.jobDuration
    const percent = usage.jobDuration / durationMax
    const tooltip = `${usage.jobDuration} mins/${durationMax} mins`

    return [percent, tooltip]
  }, [usage.jobDuration, usagePack?.jobDurationMonthly])

  const [storagePercent, storageUsage] = useMemo(() => {
    if (usagePack?.storage === -1) {
      return [0.5, `${usage.storage} MB/Unlimited`]
    }

    const storageMax = usagePack?.storage ?? usage.storage
    const percent = usage.storage / storageMax
    const tooltip = `${usage.storage} MB/${storageMax}MB`

    return [percent, tooltip]
  }, [usage.storage, usagePack?.storage])

  const usagePackDisplay = useMemo(() => {
    if (!usagePack) {
      return {
        jobCount: '-',
        jobDuration: '-',
        storageSize: '-',
      }
    }

    const { jobCountMonthly, jobDurationMonthly, storage } = usagePack

    return {
      jobCount: jobCountMonthly === -1 ? 'Unlimited' : jobCountMonthly,
      jobDuration: jobDurationMonthly === -1 ? 'Unlimited' : `${formatTime(jobDurationMonthly)}`,
      storageSize: storage === -1 ? 'Unlimited' : storage,
    }
  }, [usagePack])

  useEffect(() => {
    fetchUsage()
  }, [fetchUsage])

  return (
    <div>
      <h3>Usages</h3>
      <UsageTableWrapper>
        <UsageBlock>
          <UsageBlockIcon>
            <NumberOutlined />
          </UsageBlockIcon>
          <UsageBlockInfo>
            <UsageBlockTitle>
              <h4>Job Count</h4>
              <span>{currentMonth}</span>
            </UsageBlockTitle>
            <ProgressWrapper>
              <Progress percent={countPercent} />
              <ProgressValue>{countUsage}</ProgressValue>
            </ProgressWrapper>
          </UsageBlockInfo>
        </UsageBlock>
        <UsageBlock>
          <UsageBlockIcon>
            <ClockCircleOutlined />
          </UsageBlockIcon>
          <UsageBlockInfo>
            <UsageBlockTitle>
              <h4>Job Duration</h4>
              <span>{currentMonth}</span>
            </UsageBlockTitle>
            <ProgressWrapper>
              <Progress percent={durationPercent} />
              <ProgressValue>{durationUsage}</ProgressValue>
            </ProgressWrapper>
          </UsageBlockInfo>
        </UsageBlock>
        <UsageBlock>
          <UsageBlockIcon>
            <CloudServerOutlined />
          </UsageBlockIcon>
          <UsageBlockInfo>
            <UsageBlockTitle>
              <h4>Storage</h4>
            </UsageBlockTitle>
            <ProgressWrapper>
              <Progress percent={storagePercent} />
              <ProgressValue>{storageUsage}</ProgressValue>
            </ProgressWrapper>
          </UsageBlockInfo>
        </UsageBlock>
      </UsageTableWrapper>

      <h3>Usage Pack</h3>
      <UsagePackWrapper>
        <UsagePackHeader>
          <Text variant="large" styles={{ root: { fontWeight: 600 } }}>
            {usagePack?.name ?? 'NO PACK'}
          </Text>
        </UsagePackHeader>
        <UsagePackContent>
          <Stack horizontal horizontalAlign="start" verticalAlign="center" tokens={{ childrenGap: '8px' }}>
            <UsagePackIcon>
              <NumberOutlined />
            </UsagePackIcon>
            <span>
              <b>{usagePackDisplay.jobCount}</b> jobs count per month
            </span>
          </Stack>
          <Stack horizontal horizontalAlign="start" verticalAlign="center" tokens={{ childrenGap: '8px' }}>
            <UsagePackIcon>
              <ClockCircleOutlined />
            </UsagePackIcon>
            <span>
              <b>{usagePackDisplay.jobDuration}</b> job duration time per month
            </span>
          </Stack>
          <Stack horizontal horizontalAlign="start" verticalAlign="center" tokens={{ childrenGap: '8px' }}>
            <UsagePackIcon>
              <CloudServerOutlined />
            </UsagePackIcon>
            <span>
              <b>{usagePackDisplay.storageSize}</b> storage space
            </span>
          </Stack>
        </UsagePackContent>
      </UsagePackWrapper>
    </div>
  )
}
