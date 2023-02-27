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

import { Stack, Toggle } from '@fluentui/react'
import { forwardRef, useCallback, useImperativeHandle, useState } from 'react'

import { LabelWithTips } from '@perfsee/components'

interface FormReactProps {
  defaultEnable: boolean
}

const tips = `Collect timing information about each component in React applications. Only works for pages using webpack bundle or direct cdn link of \`react-dom\` now.`

export const FormReact = forwardRef((props: FormReactProps, ref) => {
  const [enable, setEnable] = useState(props.defaultEnable)

  useImperativeHandle(
    ref,
    () => ({
      getReactProfilingEnable() {
        return enable
      },
    }),
    [enable],
  )

  const onToggle = useCallback(() => {
    setEnable((enable) => !enable)
  }, [setEnable])

  return (
    <Stack horizontal horizontalAlign="space-between" tokens={{ padding: '8px 0 0 0' }}>
      <LabelWithTips label="React Profiling (experimental)" tips={tips} />
      <Stack horizontal verticalAlign="center">
        <Toggle
          defaultChecked={enable}
          styles={{ root: { marginBottom: 0 } }}
          onText="Enable"
          offText="Disable"
          onClick={onToggle}
        />
      </Stack>
    </Stack>
  )
})
