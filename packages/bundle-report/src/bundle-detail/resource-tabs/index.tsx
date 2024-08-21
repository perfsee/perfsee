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

import { Panel, PanelBase, Pivot, PivotItem, Stack } from '@fluentui/react'
import { parse, stringify } from 'query-string'
import { FC, MouseEvent, useCallback, useContext, useEffect, useRef, useState } from 'react'

import { AssetInfo, EntryDiff, ModuleReasons, ModuleTreeNode } from '@perfsee/shared'

import { ModuleItem } from '../../bundle-content/treeview'
import { RouterContext } from '../../router-context'
import { ModuleTraceContext, PackageTraceContext } from '../context'

import { AssetFilter } from './asset-filter'
import { AssetsTable } from './assets-table'
import { ModuleCode, TraceType } from './code'
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
  hasMultipleEntries: boolean
  visualizationLink?: string
  getAssetContent: (asset: AssetInfo) => Promise<ModuleTreeNode[]>
  getModuleReasons?: (sourceRef: number, targetRef: number) => Promise<ModuleReasons | null>
}

export const ResourceTabs: FC<Props> = ({
  diff,
  visualizationLink,
  getAssetContent,
  getModuleReasons,
  hasMultipleEntries,
}) => {
  const { history, location } = useContext(RouterContext)
  const queries: { tab?: string; trace?: string } = parse(location?.search || '')
  const { ref } = useContext(PackageTraceContext)
  const moduleTraceContext = useContext(ModuleTraceContext)
  const [traceSourceRef, setTraceSourceRef] = useState<number | null>(null)
  const panelRef = useRef<PanelBase>()
  const [traceModule, setTraceModule] = useState<string | null>(null)
  const [traceType, setTraceType] = useState(TraceType.Reasons)
  const [panelSearchText, setPanelSearchText] = useState<string>('')

  const packageTraceContext = useContext(PackageTraceContext)
  const onCloseTrace = useCallback(() => {
    if (packageTraceContext.setRef) {
      packageTraceContext.setRef(null)
    } else if (queries.trace) {
      history?.push(`${location?.pathname}?${stringify({ ...queries, trace: undefined })}`)
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

  useEffect(() => {
    if (moduleTraceContext.module && getModuleReasons) {
      panelRef.current?.open()
      setTraceType(moduleTraceContext.traceType)
      setTraceModule(moduleTraceContext.module)
    }
  }, [moduleTraceContext.module, getModuleReasons, moduleTraceContext.traceType])

  const onChange = useCallback(
    (item?: PivotItem) => {
      if (!item) {
        return
      }

      if (item.props.itemKey === Tab.Visualization && visualizationLink) {
        history?.push(visualizationLink)
        return
      }

      if (queries.tab !== item.props.itemKey) {
        history?.push(`${location?.pathname}?${stringify({ ...queries, tab: item.props.itemKey })}`)
      }
    },
    [history, location?.pathname, queries, visualizationLink],
  )

  const onClickModule = useCallback(
    (module: ModuleItem) => {
      const modulePath = module.key.startsWith('.') ? module.key : `./${module.key}`
      if (getModuleReasons) {
        panelRef.current?.open()
        setTraceType(TraceType.Reasons)
        setTraceModule(modulePath)
      }
    },
    [getModuleReasons],
  )

  const onClickPanelModulePath = useCallback((path: string) => {
    const modulePath = path.startsWith('.') ? path : `./${path}`
    setTraceType(TraceType.Reasons)
    setTraceModule(modulePath)
  }, [])

  const onRenderPanelHeader = useCallback(() => {
    return (
      <div style={{ padding: '0 12px 0 24px', width: '100%' }}>
        <Stack
          styles={{ root: { fontSize: 18, fontWeight: 600, whiteSpace: 'nowrap', height: 32 } }}
          horizontal
          verticalAlign="center"
          horizontalAlign="space-between"
        >
          {traceType === TraceType.SideEffects ? 'Side effects in' : 'Import trace for'} module:
          <span style={{ display: 'inline-block' }}>
            <AssetFilter searchText={panelSearchText} onChangeSearchText={setPanelSearchText} title="Filter Modules" />
          </span>
        </Stack>
        <div
          style={{
            wordBreak: 'break-all',
            backgroundColor: '#f6f6f7',
            border: '1px solid #c2c2c4',
            borderRadius: 4,
            padding: '1px 4px',
            fontSize: 16,
            width: 'fit-content',
          }}
        >
          {traceModule}
        </div>
      </div>
    )
  }, [traceModule, panelSearchText, traceType])

  const onClickPanelSideEffects = useCallback(
    (module: ModuleItem) => {
      const modulePath = module.key.startsWith('.') ? module.key : `./${module.key}`
      if (getModuleReasons) {
        panelRef.current?.open()
        setTraceType(TraceType.SideEffects)
        setTraceModule(modulePath)
      }
    },
    [getModuleReasons],
  )

  const onTracePanelDismiss = useCallback(() => {
    moduleTraceContext.setModule?.(null)
  }, [moduleTraceContext])

  return (
    <>
      <Pivot onLinkClick={onChange} selectedKey={typeof ref === 'number' ? Tab.Packages : queries.tab ?? Tab.Assets}>
        <PivotItem headerText="Assets" itemKey={Tab.Assets}>
          <AssetsTable
            diff={diff}
            getAssetContent={getAssetContent}
            hasMultipleEntries={hasMultipleEntries}
            onClickModule={onClickModule}
            onClickSideEffects={onClickPanelSideEffects}
          />
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
      <Panel
        isLightDismiss
        ref={panelRef}
        onRenderHeader={onRenderPanelHeader}
        type={3}
        styles={{
          content: { padding: 0 },
          commands: { paddingBottom: 6 },
          navigation: { justifyContent: 'space-between' },
        }}
        onDismiss={onTracePanelDismiss}
      >
        <ModuleCode
          getModuleReasons={getModuleReasons}
          modulePath={traceModule || ''}
          searchText={panelSearchText}
          onClickPath={onClickPanelModulePath}
          type={traceType}
        />
      </Panel>
    </>
  )
}
