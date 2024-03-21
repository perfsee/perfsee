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
import { FC, MouseEvent, useCallback, useContext, useState } from 'react'
import { useHistory, useLocation } from 'react-router'

import { AssetInfo, EntryDiff, ModuleReasons, ModuleTreeNode } from '@perfsee/shared'

import { PackageTraceContext } from '../context'

import { AssetsTable } from './assets-table'
import { ImportTraceModal } from './import-trace-modal'
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
  getAssetContent: (asset: AssetInfo) => Promise<ModuleTreeNode[]>
  getModuleReasons?: (sourceRef: number, targetRef: number) => Promise<ModuleReasons | null>
}

export const ResourceTabs: FC<Props> = ({ diff, visualizationLink, getAssetContent, getModuleReasons }) => {
  const history = useHistory()
  const location = useLocation()
  const queries: { tab?: string; trace?: string } = parse(location.search)
  const { ref } = useContext(PackageTraceContext)
  const [traceSourceRef, setTraceSourceRef] = useState<number | null>(null)

  const packageTraceContext = useContext(PackageTraceContext)
  const onCloseTrace = useCallback(() => {
    if (packageTraceContext.setRef) {
      packageTraceContext.setRef(null)
    } else if (queries.trace) {
      history.push(`${location.pathname}?${stringify({ ...queries, trace: undefined })}`)
    }
  }, [history, queries, packageTraceContext, location])
  const onHideTraceModal = useCallback(() => {
    onCloseTrace()
    setTraceSourceRef(null)
  }, [onCloseTrace])

  const onChangeSource = useCallback((ref: number) => {
    setTraceSourceRef(ref)
  }, [])

  const onShowTraceModal = useCallback(
    (ref: number) => (e: MouseEvent<HTMLElement>) => {
      e.stopPropagation()
      setTraceSourceRef(ref)
    },
    [],
  )

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
    <>
      <Pivot onLinkClick={onChange} selectedKey={typeof ref === 'number' ? Tab.Packages : queries.tab ?? Tab.Assets}>
        <PivotItem headerText="Assets" itemKey={Tab.Assets}>
          <AssetsTable diff={diff} getAssetContent={getAssetContent} />
        </PivotItem>
        <PivotItem headerText="Packages" itemKey={Tab.Packages}>
          <PackagesTable diff={diff} getModuleReasons={getModuleReasons} onShowTraceModal={onShowTraceModal} />
        </PivotItem>
        {visualizationLink && <PivotItem headerText="Visualization" itemKey={Tab.Visualization} />}
      </Pivot>
      <ImportTraceModal
        traceSourceRef={traceSourceRef || (queries.trace ? Number(queries.trace) : null) || packageTraceContext.ref}
        packageIssueMap={diff.packageIssueMap}
        onClose={onHideTraceModal}
        onChangeSource={onChangeSource}
        getModuleReasons={getModuleReasons}
      />
    </>
  )
}
