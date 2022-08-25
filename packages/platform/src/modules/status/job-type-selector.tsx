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

import { Dropdown, IDropdownOption, IDropdownProps } from '@fluentui/react'
import { memo, useCallback } from 'react'

import { JobType } from '@perfsee/schema'

const options: IDropdownOption[] = Object.values(JobType).map((type) => ({
  key: type,
  text: type,
}))

type JobTypeSelectorProps = Omit<IDropdownProps, 'jobType' | 'onChange' | 'options'> & {
  jobType?: JobType | null
  onChange: (jobType: JobType) => void
}

export const JobTypeSelector = memo(({ jobType, onChange, ...props }: JobTypeSelectorProps) => {
  const onJobTypeChange = useCallback(
    (_: any, option?: IDropdownOption<any> | undefined) => {
      if (option?.key) {
        onChange(option.key as JobType)
      }
    },
    [onChange],
  )
  return (
    <Dropdown
      {...props}
      selectedKey={jobType}
      options={options}
      onChange={onJobTypeChange}
      styles={{ dropdown: { minWidth: 150 } }}
    />
  )
})
