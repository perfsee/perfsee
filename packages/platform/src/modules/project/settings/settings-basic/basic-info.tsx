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

import { CopyOutlined } from '@ant-design/icons'
import { Label, SharedColors, Stack, TextField } from '@fluentui/react'
import { useModule, useModuleState } from '@sigi/react'
import { FC, useCallback, useMemo, useState } from 'react'

import { ForeignLink } from '@perfsee/components'
import { notify } from '@perfsee/platform/common'
import { AuthApps } from '@perfsee/platform/modules/components'
import { ProjectModule } from '@perfsee/platform/modules/shared'
import { CommonGitHost } from '@perfsee/shared'
import { isBaselineRegex } from '@perfsee/shared/utils'

import { BasicSettingsModule } from './module'
import { BranchRegexWarning, Field } from './style'

const SelectWidth = 500

const checkIsInvalidRegex = (str?: string) => {
  const value = str?.trim()

  if (!value || !isBaselineRegex(value)) {
    return false
  }

  try {
    new RegExp(value.slice(1, -1))
    return false
  } catch {
    return true
  }
}

const BaselineInput: FC<{ defaultValue: string; onChange: (value?: string) => void }> = ({
  defaultValue,
  onChange,
}) => {
  const [isInvalidRegex, setIsInvalidRegex] = useState(false)

  const onChangeInput = useCallback(
    (_e: any, value?: string) => {
      onChange(value?.trim())
      const valid = checkIsInvalidRegex(value)
      setIsInvalidRegex(valid)
    },
    [onChange],
  )

  return (
    <Field name="Bundle Baseline Branch" note="Regular expression acceptable. e.g, /rc-*/">
      <TextField defaultValue={defaultValue} onChange={onChangeInput} />
      {isInvalidRegex && <BranchRegexWarning>Invalid regex, will be treated as normal branch name</BranchRegexWarning>}
    </Field>
  )
}

export const BasicInfo = () => {
  const { project } = useModuleState(ProjectModule)
  const [{ projectChanging }, { updateProjectField }] = useModule(BasicSettingsModule)

  const gitHostRepoUrl = useMemo(() => project && new CommonGitHost(project).repoUrl(), [project])

  const onChangeBaseline = useCallback(
    (value?: string) => {
      updateProjectField({ field: 'artifactBaselineBranch', value })
    },
    [updateProjectField],
  )

  const onCopyId = useCallback(() => {
    navigator.clipboard
      .writeText(project?.id ?? '')
      .then(() => {
        notify.success({ content: 'Copied', duration: 3000 })
      })
      .catch(() => {
        notify.error({ content: 'Copy failed, please copy it manually.' })
      })
  }, [project?.id])

  const { artifactBaselineBranch: updatedArtifactBaselineBranch } = projectChanging

  if (!project) {
    return null
  }
  const { artifactBaselineBranch } = project

  return (
    <Stack>
      <Stack.Item styles={{ root: { maxWidth: SelectWidth } }}>
        <Label>ID</Label>
        {project.id}
        <CopyOutlined
          style={{ color: SharedColors.cyanBlue10, cursor: 'pointer', paddingLeft: '4px' }}
          onClick={onCopyId}
        />
      </Stack.Item>
      {gitHostRepoUrl && (
        <Stack.Item styles={{ root: { maxWidth: SelectWidth } }}>
          <Label>Repository</Label>
          <ForeignLink href={gitHostRepoUrl}>{gitHostRepoUrl}</ForeignLink>
        </Stack.Item>
      )}
      <Stack.Item>
        <AuthApps projectId={project.id} />
      </Stack.Item>
      <Stack.Item styles={{ root: { maxWidth: SelectWidth } }} tokens={{ padding: '8px 0 0 0' }}>
        <BaselineInput
          defaultValue={updatedArtifactBaselineBranch ?? artifactBaselineBranch}
          onChange={onChangeBaseline}
        />
      </Stack.Item>
    </Stack>
  )
}
