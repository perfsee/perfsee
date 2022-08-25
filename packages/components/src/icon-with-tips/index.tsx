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

import { QuestionCircleOutlined } from '@ant-design/icons'
import { TooltipHost } from '@fluentui/react'
import { ReactChild } from 'react'

type Props = {
  content: string | JSX.Element | JSX.Element[]
  icon?: ReactChild
  iconSize?: number
  marginLeft?: string
  marginRight?: string
}
export const IconWithTips = (props: Props) => {
  const { icon, iconSize = 14, content, marginLeft, marginRight } = props

  return (
    <TooltipHost styles={{ root: { display: 'inline-flex', alignItems: 'center' } }} content={content}>
      {icon ?? (
        <QuestionCircleOutlined
          size={iconSize ?? 12}
          style={{ cursor: 'pointer', marginLeft, marginRight, fontSize: iconSize }}
        />
      )}
    </TooltipHost>
  )
}
