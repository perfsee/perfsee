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

import { TooltipOverflowMode, TooltipHost } from '@fluentui/react'
import { FC, ReactNode } from 'react'

type Props = {
  content?: JSX.Element | string
  tooltipContent?: JSX.Element | string
  alwaysShown?: boolean
  children?: ReactNode
  background?: string
}

export const TooltipWithEllipsis: FC<Props> = ({ content, tooltipContent, alwaysShown, children, background }) => {
  return (
    <TooltipHost
      content={tooltipContent ?? content}
      overflowMode={alwaysShown ? undefined : TooltipOverflowMode.Self}
      styles={{
        root: {
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'break-all',
          display: 'block',
        },
      }}
      calloutProps={{
        styles: {
          calloutMain: {
            wordBreak: 'break-word',
            background,
          },
          beakCurtain: {
            background,
          },
          beak: {
            background,
          },
        },
      }}
    >
      <span>{children ?? content}</span>
    </TooltipHost>
  )
}
