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

import { formatTime } from '@perfsee/platform/common'
import { PrettyBytes } from '@perfsee/shared'

import { DeviceType, ConnectionType, PageSchema, PageRelation } from '../../shared'

export const DefaultDevice = {
  id: 'no',
  value: 'No emulation: Chrome(Default)',
  shortTitle: 'Chrome',
}

export const DefaultConnection = {
  id: 'no',
  title: 'No connection throttling: Native speed',
  shortTitle: 'No bandwidth throttling',
}

export const getDevicesOptions = (devices: DeviceType[]) => {
  return [DefaultDevice, ...devices].map((device) => {
    return {
      key: device.id,
      text: device.value,
    }
  })
}

export const getConnectionsOptions = (connections: ConnectionType[]) => {
  return [DefaultConnection, ...connections].map((connection) => {
    const item = connection as ConnectionType
    const { value, unit } = formatTime(item.latency ?? 0)
    const latency = item.latency ? `${value}${unit}` : null
    const speed = latency
      ? `(Latency:${latency}, Downstream: ${PrettyBytes.stringify(item.download!)}), Upstream: ${PrettyBytes.stringify(
          item.upload!,
        )}`
      : ''
    return {
      key: item.id,
      text: `${item.title}${speed}`,
    }
  })
}

export const getConnectionTitleByKey = (connections: ConnectionType[], key: string) => {
  const connection = connections.find((item) => item.id === key)
  return connection ? connection.title : DefaultConnection.shortTitle
}

export const getDeviceTitleByKey = (devices: DeviceType[], key: string) => {
  const device = devices.find((item) => item.id === key)
  return device ? device.value : DefaultDevice.shortTitle
}

export const disableSavePage = (page: Partial<PageSchema>, relation: Pick<PageRelation, 'profileIds' | 'envIds'>) => {
  return (
    !page?.name ||
    !page.url ||
    (page.isE2e && !page.e2eScript) ||
    !relation.profileIds.length ||
    !relation.envIds.length
  )
}

export const emptyRelation = {
  envIds: [] as number[],
  profileIds: [] as number[],
  competitorIds: [] as number[],
}
