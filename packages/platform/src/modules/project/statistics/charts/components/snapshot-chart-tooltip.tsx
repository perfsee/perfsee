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

import { LinkOutlined } from '@ant-design/icons'
import { Stack } from '@fluentui/react'
import Dayjs from 'dayjs'

import { ForeignLink } from '@perfsee/components'
import { ProjectInfo } from '@perfsee/platform/modules/shared'
import { pathFactory } from '@perfsee/shared/routes'

import { ColorDot } from '../style'

const stackTokens = { childrenGap: 4, padding: '10px' }

export type SnapshotChartItemType = {
  reportId: number
  snapshotId: number
  createdAt: number | string
  value: number
  pageName: string
  profileName: string
  envName: string
}
type DataSchema = { data: SnapshotChartItemType; color: string }

export const SnapshotChartTooltip = (props: {
  project: ProjectInfo
  title: string
  dataList: DataSchema[]
  formatter: (value: number | string) => string
}) => {
  const { dataList, title, formatter, project } = props

  return (
    <Stack tokens={stackTokens}>
      <p>{title}</p>
      <table css={{ textAlign: 'left' }}>
        <thead>
          <tr>
            <th />
            <th>Page</th>
            <th>Env</th>
            <th>Profile</th>
            <th>Score</th>
            <th>Created</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {dataList.map(({ data, color }, i) => {
            const link = pathFactory.project.lab.report({
              projectId: project.id,
              reportId: data.reportId,
              tabName: 'overview',
            })

            return (
              <tr key={i}>
                <td>
                  <ColorDot color={color} />
                </td>
                <td>{data.pageName}</td>
                <td>{data.envName}</td>
                <td>{data.profileName}</td>
                <td>{formatter(data.value)}</td>
                <td>{Dayjs(data.createdAt).format('YYYY/MM/DD')}</td>
                <td>
                  <ForeignLink href={link}>
                    <LinkOutlined /> view
                  </ForeignLink>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </Stack>
  )
}
