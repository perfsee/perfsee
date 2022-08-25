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

import { Stack, IDropdownOption, DefaultButton } from '@fluentui/react'
import { useMemo, useCallback, FC, useState } from 'react'

import { ContentCard, Select } from '@perfsee/components'
import { BundleDiff } from '@perfsee/shared'
import { PrettyBytes } from '@perfsee/utils'

import { BuildHistory } from './build-history'
import { DuplicatePackages } from './duplicate-packages'
import { Overview } from './overview'
import { ResourceTabs } from './resource-tabs'
import { cardGap } from './style'
import { ArtifactDiff } from './types'

export interface BundleReportProps {
  artifact: ArtifactDiff
  diff: BundleDiff
  onBaselineSelectorOpen?: () => void
  defaultEntryPoint?: string
  onEntryPointChange?: (entryPoint: string) => void
  contentLink?: string
}

export const BundleReport: FC<BundleReportProps> = ({
  artifact,
  diff,
  defaultEntryPoint,
  contentLink,
  onBaselineSelectorOpen,
  onEntryPointChange,
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

  const onRenderHeader = useCallback(() => {
    return <span>Bundle #{artifact.id}</span>
  }, [artifact])

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
        <DuplicatePackages diff={currentEntryPointDiff} />
        <ResourceTabs diff={currentEntryPointDiff} visualizationLink={contentLink} />
      </Stack>
    </ContentCard>
  )
}
