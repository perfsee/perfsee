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

import { IChoiceGroupOption } from '@fluentui/react'
import { FormEvent, useCallback, useMemo } from 'react'

import { CalloutChoiceGroup } from '../callout-choice-group'

type Props<T> = {
  id?: T
  options: { id: T; name: string }[]
  onChange: (id: T) => void
  onRenderTitle?: (name: string) => string | JSX.Element
  isFirst?: boolean
  onClick?: () => void
}

type GroupOption<T> = IChoiceGroupOption & { payload: T }

export const SingleSelector = <T,>(props: Props<T>) => {
  const { onChange, id, options, onRenderTitle, isFirst } = props

  const onKeyChange = useCallback(
    (_ev?: FormEvent<HTMLElement>, option?: GroupOption<T>) => {
      if (option?.payload) {
        onChange(option.payload)
      }
    },
    [onChange],
  )

  const [title, items] = useMemo(() => {
    const selected = options.find((v) => v.id === id)

    const items: GroupOption<T>[] = []
    options.forEach((v) => {
      items.push({ key: String(v.id), text: v.name, payload: v.id })
    })

    const name = selected?.name ?? ''

    return [onRenderTitle ? onRenderTitle(name) : name, items]
  }, [options, onRenderTitle, id])

  if (!options.length) {
    return null
  }

  return (
    <CalloutChoiceGroup<GroupOption<T>>
      defaultSelectedKey={String(id)}
      items={items}
      title={title}
      onChange={onKeyChange}
      isFirst={isFirst}
      onClick={props.onClick}
    />
  )
}
