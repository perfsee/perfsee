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

import { SelectionMode } from '@fluentui/utilities'
import { useModuleState } from '@sigi/react'
import { Link } from 'react-router-dom'

import { Table, TableColumnProps } from '@perfsee/components'
import { pathFactory } from '@perfsee/shared/routes'

import { OrganizationModule, OrganizationUsageInfo } from './organization.module'

const columns = [
  {
    key: 'projectId',
    name: 'Project',
    minWidth: 100,
    maxWidth: 160,
    onRender: (item) => {
      return <Link to={pathFactory.project.home({ projectId: item.projectId })}>{item.projectId}</Link>
    },
  },
  {
    key: 'jobDuration',
    name: 'Job Duration',
    minWidth: 100,
    maxWidth: 160,
    onRender: (item) => <div>{item.jobDuration}mins</div>,
  },
  {
    key: 'storage',
    name: 'Storage',
    minWidth: 100,
    maxWidth: 160,
    onRender: (item) => <div>{item.storage} MB</div>,
  },
  {
    key: 'jobCount',
    name: 'Job Count',
    fieldName: 'jobCount',
    minWidth: 100,
    maxWidth: 160,
  },
  {
    key: 'snapshotReportCount',
    name: 'Snapshot report Count',
    fieldName: 'snapshotReportCount',
    minWidth: 100,
    maxWidth: 160,
  },
  {
    key: 'artifactCount',
    name: 'Artifact Count',
    fieldName: 'artifactCount',
    minWidth: 100,
    maxWidth: 160,
  },
  {
    key: 'labScore',
    name: 'Lab score',
    fieldName: 'labScore',
    minWidth: 100,
    maxWidth: 160,
  },
  {
    key: 'bundleScore',
    name: 'Bundle score',
    fieldName: 'bundleScore',
    minWidth: 100,
    maxWidth: 160,
  },
] as TableColumnProps<OrganizationUsageInfo[0]>[]

export const OrganizationTable = () => {
  const { organizationUsage, usageLoading } = useModuleState(OrganizationModule)

  return (
    <Table
      enableShimmer={usageLoading}
      items={organizationUsage}
      selectionMode={SelectionMode.none}
      columns={columns}
      disableVirtualization={organizationUsage.length < 100}
    />
  )
}
