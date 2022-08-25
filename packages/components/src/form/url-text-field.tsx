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

import { ITextFieldProps, TextField } from '@fluentui/react'
import { useCallback } from 'react'

import { isNonEmptyUrl } from './validators'

type Props = {
  onChange: (url?: string) => void
}

export const URLTextField = (props: Omit<ITextFieldProps, keyof Props> & Props) => {
  const { onChange, required } = props

  const onURLChange = useCallback(
    (_e: any, value?: string) => {
      onChange?.(value)
    },
    [onChange],
  )

  return (
    <TextField
      placeholder="https://example.com"
      label="URL"
      {...props}
      onChange={onURLChange}
      onGetErrorMessage={required ? isNonEmptyUrl : void 0}
    />
  )
}
