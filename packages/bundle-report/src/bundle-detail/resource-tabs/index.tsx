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

import { Pivot, PivotItem } from '@fluentui/react'
import { parse, stringify } from 'query-string'
import { FC, useCallback } from 'react'
import { useHistory, useLocation } from 'react-router'

import { EntryDiff } from '@perfsee/shared'

import { AssetsTable } from './assets-table'
import { Audits } from './audits'
import { PackagesTable } from './packages-table'

enum Tab {
  Assets = 'assets',
  Packages = 'packages',
  Audits = 'audits',
  Visualization = 'visualization',
}

interface Props {
  diff: EntryDiff
  visualizationLink?: string
}

export const ResourceTabs: FC<Props> = ({ diff, visualizationLink }) => {
  const history = useHistory()
  const location = useLocation()
  const queries: { tab?: string } = parse(location.search)

  const onChange = useCallback(
    (item?: PivotItem) => {
      if (!item) {
        return
      }

      if (item.props.itemKey === Tab.Visualization && visualizationLink) {
        history.push(visualizationLink)
        return
      }

      if (queries.tab !== item.props.itemKey) {
        history.push(`${location.pathname}?${stringify({ ...queries, tab: item.props.itemKey })}`)
      }
    },
    [history, location.pathname, queries, visualizationLink],
  )

  return (
    <Pivot onLinkClick={onChange} selectedKey={queries.tab ?? Tab.Assets}>
      <PivotItem headerText="Assets" itemKey={Tab.Assets}>
        <AssetsTable diff={diff} />
      </PivotItem>
      <PivotItem headerText="Packages" itemKey={Tab.Packages}>
        <PackagesTable diff={diff} />
      </PivotItem>
      <PivotItem headerText="Audits" itemKey={Tab.Audits}>
        <Audits audits={diff.audits} />
      </PivotItem>
      {visualizationLink && <PivotItem headerText="Visualization" itemKey={Tab.Visualization} />}
    </Pivot>
  )
}
