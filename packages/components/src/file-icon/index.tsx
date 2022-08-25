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

import { SharedColors } from '@fluentui/theme'
import { memo } from 'react'

import { AssetTypeEnum } from '@perfsee/shared'

import { CssIcon, JsIcon, HtmlIcon, ImageIcon, MediaIcon, FontIcon, OtherIcon } from '../icon'

import { FileIconWrap } from './styled'

// https://developer.microsoft.com/en-us/fluentui#/styles/web/colors/shared
export const FileColorsMaps: {
  [k in AssetTypeEnum]: {
    foreground: string
    background: string
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  }
} = {
  [AssetTypeEnum.Js]: { background: SharedColors.yellow10, foreground: 'black', icon: JsIcon },
  [AssetTypeEnum.Image]: { background: SharedColors.magenta10, foreground: 'white', icon: ImageIcon },
  [AssetTypeEnum.Css]: { background: SharedColors.blueMagenta10, foreground: 'white', icon: CssIcon },
  [AssetTypeEnum.Html]: { background: SharedColors.magentaPink10, foreground: 'white', icon: HtmlIcon },
  [AssetTypeEnum.Font]: { background: SharedColors.gray20, foreground: 'white', icon: FontIcon },
  [AssetTypeEnum.Media]: { background: SharedColors.greenCyan10, foreground: 'white', icon: MediaIcon },
  [AssetTypeEnum.Other]: { background: SharedColors.cyan20, foreground: 'white', icon: OtherIcon },
}

export interface FileIconProps {
  type: AssetTypeEnum
}

export const FileIcon = memo<FileIconProps>((props) => {
  const fileItem = FileColorsMaps[props.type]
  return (
    <FileIconWrap>
      <fileItem.icon />
    </FileIconWrap>
  )
})
