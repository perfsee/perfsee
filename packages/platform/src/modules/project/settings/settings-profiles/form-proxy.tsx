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

interface FormProxyProps {
  defaultEnable: boolean
}

const tips = (
  <>
    Proxy portions of requests to prevent inevitable variability of networking,{' '}
    <b>which can make the lab result more stable and reliable</b>
  </>
)

export const FormProxy = forwardRef((props: FormProxyProps, ref) => {
  const [enable, setEnable] = useState(props.defaultEnable)

  useImperativeHandle(
    ref,
    () => ({
      getProxyEnable() {
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
      <LabelWithTips label="Request Proxy" tips={tips} />
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
