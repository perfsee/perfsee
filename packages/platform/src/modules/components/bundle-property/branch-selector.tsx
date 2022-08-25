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

import { useModule } from '@sigi/react'
import { compact } from 'lodash'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { SearchSelect } from '@perfsee/components'
import { convertRegex, isBaselineRegex } from '@perfsee/shared'

import { BundlePropertiesModule, useProject } from '../../shared'

import { DropDownIcon } from './styled'

const CommonBranchNames = ['master', 'develop', 'release', 'main']

const getRecommendBranch = (branches: string[], artifactBaselineBranch?: string) => {
  // if baseline branch is set to regex
  if (artifactBaselineBranch && isBaselineRegex(artifactBaselineBranch)) {
    const regex = convertRegex(artifactBaselineBranch)

    if (regex) {
      const results = branches.filter((branch) => regex.test(branch))

      if (results.length) {
        return results[0]
      }
    }
  }

  for (const name of compact([artifactBaselineBranch, ...CommonBranchNames])) {
    if (name && branches.includes(name)) {
      return name
    }
  }

  return branches[0] ?? 'master'
}

interface Props {
  defaultBranch?: string
  shouldAutoSelect?: boolean
  onChange: (branch: string | undefined) => void
}

export function BranchSelector({ onChange, defaultBranch, shouldAutoSelect = false }: Props) {
  const project = useProject()

  const [{ recentBranches }, { getBranches }] = useModule(BundlePropertiesModule)
  const [currentBranch, setCurrentBranch] = useState<string>()

  const options = useMemo(() => {
    return recentBranches.map((branch) => ({ key: branch, text: branch }))
  }, [recentBranches])

  const onSelect = useCallback(
    (key: string) => {
      onChange(key || undefined)
    },
    [onChange],
  )

  useEffect(() => {
    getBranches()
  }, [getBranches])

  useEffect(() => {
    if (recentBranches?.length && currentBranch === undefined) {
      if (defaultBranch && recentBranches.includes(defaultBranch)) {
        setCurrentBranch(defaultBranch)
        onChange(defaultBranch)
      } else if (shouldAutoSelect) {
        const branch = getRecommendBranch(recentBranches, project?.artifactBaselineBranch)
        setCurrentBranch(branch)
        onChange(branch)
      }
    }
  }, [currentBranch, defaultBranch, recentBranches, onChange, shouldAutoSelect, project?.artifactBaselineBranch])

  return (
    <SearchSelect
      multiSelect={false}
      title="Branch"
      allowFreeform
      placeholder="Filter by branch"
      options={options}
      iconProps={DropDownIcon}
      value={currentBranch}
      onChange={onSelect}
    />
  )
}
