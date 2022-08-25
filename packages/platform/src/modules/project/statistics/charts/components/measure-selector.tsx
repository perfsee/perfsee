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

import { useCallback } from 'react'

import { IconWithTips, SingleSelector } from '@perfsee/components'

type Props = {
  measure: string
  metrics: Record<string, { title: string; des: string }>
  isFirst?: boolean
  onChange: (value: string) => void
}

export const MeasureSelector = (props: Props) => {
  const { onChange, measure, isFirst, metrics } = props

  const onRenderTitle = useCallback(
    (title: string) => {
      return (
        <>
          {title}
          <IconWithTips marginLeft="4px" content={metrics[measure]?.des} />
        </>
      )
    },
    [measure, metrics],
  )
  const items = Object.keys(metrics).map((key) => ({
    id: key,
    name: metrics[key].title,
  }))

  return (
    <SingleSelector isFirst={isFirst} id={measure} options={items} onChange={onChange} onRenderTitle={onRenderTitle} />
  )
}
