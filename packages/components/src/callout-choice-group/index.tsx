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

import { DownOutlined } from '@ant-design/icons'
import styled from '@emotion/styled'
import { Callout, ChoiceGroup, IChoiceGroupProps, IChoiceGroupOption } from '@fluentui/react'
import { noop } from 'lodash'
import { FormEvent, useState, useCallback, useRef } from 'react'

import { SelectorTitle, CalloutWrapper, CalloutLabel } from './style'

export interface CalloutRadioGroupProps<T extends IChoiceGroupOption> {
  label?: React.ReactNode
  onChange?: (ev?: React.FormEvent<HTMLElement | HTMLInputElement>, option?: T) => void
  defaultSelectedKey?: IChoiceGroupProps['defaultSelectedKey']
  items: T[]
  title: string | JSX.Element
  isFirst?: boolean
  onClick?: () => void
}

const StyledDownOutlinedIcon = styled(DownOutlined)({ marginLeft: '5px', fontSize: '12px' })

export function CalloutChoiceGroup<T extends IChoiceGroupOption>(props: CalloutRadioGroupProps<T>) {
  const [calloutVisible, setCalloutVisible] = useState(false)
  const toggleCalloutVisible = useCallback(() => {
    setCalloutVisible((visible) => !visible)
  }, [])

  const onClick = useCallback(() => {
    toggleCalloutVisible()
    props.onClick?.()
  }, [props, toggleCalloutVisible])

  const selectorTitleRef = useRef<HTMLSpanElement | null>(null)

  const onChangeOnProps = props.onChange ?? noop
  const onChange = useCallback(
    (ev?: FormEvent<HTMLElement | HTMLInputElement>, option?: IChoiceGroupOption) => {
      onChangeOnProps(ev, option as T)
      toggleCalloutVisible()
    },
    [onChangeOnProps, toggleCalloutVisible],
  )

  const calloutNode = calloutVisible && (
    <Callout calloutMaxWidth={400} calloutMaxHeight={500} onDismiss={toggleCalloutVisible} target={selectorTitleRef}>
      <ChoiceGroup
        styles={{ root: { wordBreak: 'break-word', padding: '10px 16px' } }}
        onChange={onChange}
        defaultSelectedKey={props.defaultSelectedKey}
        options={props.items}
      />
    </Callout>
  )
  return (
    <CalloutWrapper>
      {props.label && <CalloutLabel>{props.label}:</CalloutLabel>}
      <SelectorTitle isFirst={props.isFirst} onClick={onClick}>
        <span ref={selectorTitleRef}>{props.title}</span>
        <StyledDownOutlinedIcon />
        {calloutNode}
      </SelectorTitle>
    </CalloutWrapper>
  )
}
