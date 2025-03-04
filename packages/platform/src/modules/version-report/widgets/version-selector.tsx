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

import { FC, useMemo } from 'react'

import { SearchSelect } from '@perfsee/components'

import { Version } from '../types'

type Props = {
  commit: string
  allCommits: string[]
  versions: Record<string, Version>
  onChange: (key: string) => void
}

export const CommitSelector: FC<Props> = ({ commit, allCommits, versions, onChange }) => {
  const options = useMemo(() => {
    return allCommits.map((commit) => ({
      key: commit,
      text:
        commit.slice(0, 8) +
        (versions[commit]?.commitMessage ? ` | ${versions[commit]?.commitMessage}` : '') +
        (versions[commit]?.version ? ` | ${versions[commit].version}` : ''),
    }))
  }, [allCommits, versions])

  if (!allCommits.length) {
    return null
  }

  return (
    <div style={{ width: 600 }}>
      <SearchSelect
        title="Commit"
        onChange={onChange}
        options={options}
        selectOptions={options}
        value={commit}
        required
      />
    </div>
  )
}
