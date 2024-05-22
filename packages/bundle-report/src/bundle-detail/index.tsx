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

import { Stack, IDropdownOption, DefaultButton, ActionButton } from '@fluentui/react'
import { useMemo, useCallback, FC, useState } from 'react'

import { ContentCard, Select } from '@perfsee/components'
import { AssetInfo, BundleDiff, ModuleReasons, ModuleTreeNode } from '@perfsee/shared'
import { PrettyBytes } from '@perfsee/utils'

import { BuildHistory } from './build-history'
import { Overview } from './overview'
import { ResourceTabs } from './resource-tabs'
import { Audits } from './resource-tabs/audits'
import { cardGap } from './style'
import { ArtifactDiff } from './types'

export * from './context'

export interface BundleReportProps {
  artifact: ArtifactDiff
  diff: BundleDiff
  onBaselineSelectorOpen?: () => void
  defaultEntryPoint?: string
  onEntryPointChange?: (entryPoint: string) => void
  contentLink?: string
  downloadLink?: string
  getAssetContent: (asset: AssetInfo) => Promise<ModuleTreeNode[]>
  getModuleReasons?: (sourceRef: number, targetRef: number) => Promise<ModuleReasons | null>
}

export const BundleReport: FC<BundleReportProps> = ({
  artifact,
  diff,
  defaultEntryPoint,
  contentLink,
  downloadLink,
  onBaselineSelectorOpen,
  onEntryPointChange,
  getAssetContent,
  getModuleReasons,
}) => {
  const dropdownOptions = useMemo<IDropdownOption<string>[]>(() => {
    return Object.entries(diff).map(([entryName, diff]) => ({
      key: entryName,
      text: `${entryName} - ${PrettyBytes.create(diff.sizeDiff.current.raw)}`,
    }))
  }, [diff])

  const [entryPoint, setEntryPoint] = useState(() => {
    return defaultEntryPoint ?? ('main' in diff ? 'main' : dropdownOptions[0]?.key)
  })

  const onSelectEntryPoint = useCallback(
    (key: string) => {
      if (key && key !== entryPoint) {
        setEntryPoint(key)
        onEntryPointChange?.(key)
      }
    },
    [entryPoint, onEntryPointChange],
  )

  const onDownloadBundle = useCallback(() => {
    window.open(downloadLink)
  }, [downloadLink])

  const onRenderHeader = useCallback(() => {
    if (!downloadLink) {
      return <span>Bundle #{artifact.id}</span>
    }
    return (
      <Stack horizontal verticalAlign="center" horizontalAlign="space-between" styles={{ root: { width: '100%' } }}>
        <span>Bundle #{artifact.id}</span>
        <ActionButton iconProps={{ iconName: 'Download' }} onClick={onDownloadBundle}>
          Download
        </ActionButton>
      </Stack>
    )
  }, [artifact, onDownloadBundle, downloadLink])

  const currentEntryPointDiff = diff[entryPoint]

  if (!currentEntryPointDiff) {
    // for sure
    return null
  }

  return (
    <ContentCard onRenderHeader={onRenderHeader}>
      <Stack tokens={cardGap}>
        <Stack horizontal verticalAlign="center" tokens={cardGap}>
          <Select<string>
            title="Entry Point"
            options={dropdownOptions}
            selectedKey={entryPoint}
            onKeyChange={onSelectEntryPoint}
          />
          {artifact.baseline && (
            <DefaultButton onClick={onBaselineSelectorOpen} iconProps={{ iconName: 'swap' }}>
              Change Baseline
            </DefaultButton>
          )}
        </Stack>
        <BuildHistory artifact={artifact} onBaselineSelectorOpen={onBaselineSelectorOpen} />
        <Overview artifact={artifact} diff={currentEntryPointDiff} />
        <Audits
          key={entryPoint}
          audits={currentEntryPointDiff.audits.current}
          baseline={currentEntryPointDiff.audits.baseline}
        />
        <ResourceTabs
          diff={currentEntryPointDiff}
          visualizationLink={contentLink}
          getAssetContent={getAssetContent}
          getModuleReasons={getModuleReasons}
          hasMultipleEntries={Object.keys(diff).length > 1}
        />
      </Stack>
    </ContentCard>
  )
}
