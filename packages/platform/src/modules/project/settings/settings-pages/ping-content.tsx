import { Stack, IconButton, DialogFooter, DefaultButton } from '@fluentui/react'
import { FC, ReactNode, useCallback } from 'react'

import { Tag } from '@perfsee/components'
import { EnvSchema, PageSchema, PingResult, ProfileSchema } from '@perfsee/platform/modules/shared'

type Props = {
  page: Partial<PageSchema>
  pingResultMap: Map<number /**pageId */, PingResult[]>
  envMap: Map<number /* envId */, EnvSchema>
  profileMap: Map<number /* profileId */, ProfileSchema>
  onClickCheck: (pageId: number, profileId?: number, envId?: number) => void
}
export const PingContent: FC<Props> = ({ page, pingResultMap, envMap, profileMap, onClickCheck }) => {
  const onClick = useCallback(
    (pageId: number, profileId?: number, envId?: number) => {
      return () => onClickCheck(pageId, profileId, envId)
    },
    [onClickCheck],
  )

  const pageId = page.id
  if (!pageId) {
    return null
  }

  const pingResult = pingResultMap.get(pageId)
  const items: ReactNode[] = []
  if (pingResult) {
    pingResult.forEach(({ key, status }) => {
      const idList = key.split('-') // pageId-profileId-envId
      const profileId = parseInt(idList[1])
      const envId = parseInt(idList[2])

      if (envMap.get(envId) && profileMap.get(profileId)) {
        items.push(
          <Stack
            styles={{ root: { marginBottom: '4px' } }}
            horizontal
            horizontalAlign="space-between"
            verticalAlign="center"
            key={profileId + '' + envId}
          >
            <div>
              {page.name} * {envMap.get(envId)!.name} * {profileMap.get(profileId)!.name}
            </div>
            <div>
              {renderStatus(status)}
              {(!status || status === 'failed') && (
                <IconButton onClick={onClick(pageId, profileId, envId)} iconProps={{ iconName: 'ping' }} />
              )}
            </div>
          </Stack>,
        )
      }
    })
  }

  if (items.length) {
    return (
      <div>
        {items}
        <DialogFooter>
          <DefaultButton onClick={onClick(pageId)}>Test all</DefaultButton>
        </DialogFooter>
      </div>
    )
  }

  return null
}

function renderStatus(status: string | null) {
  if (!status) {
    return null
  }
  const tag =
    status === 'running' ? 'info' : status === 'success' ? 'success' : status === 'failed' ? 'error' : 'warning'

  return <Tag type={tag}>{status}</Tag>
}
