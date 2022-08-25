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

import { Global, ThemeProvider as EmotionThemeProvider, Theme } from '@emotion/react'
import { FC, memo, PropsWithChildren } from 'react'

import { BrightTheme } from './variables'

interface Props {
  theme?: Partial<Theme>
}

export const ThemeProvider: FC<PropsWithChildren<Props>> = memo((props) => {
  const variables = { ...BrightTheme, ...(props.theme ?? {}) }

  const globalStylesFromTheme = {
    body: {
      fontFamily: variables.text.fontFamily,
      fontSize: variables.text.fontSize,
      color: variables.text.color,
      backgroundColor: variables.colors.primaryBackground,
      overscrollBehavior: 'auto contain',
      a: {
        color: variables.link.color,
        transition: 'color 250ms',
        textDecoration: 'none',
        cursor: 'pointer',
      },
      'a:visited': {
        color: variables.link.visitedColor,
      },
      'a:hover': {
        color: variables.link.hoverColor,
        textDecoration: 'underline',
      },
      'a:active': {
        color: variables.link.activeColor,
      },
      'a:focus': {
        color: variables.link.focusColor,
      },
    },
    '::selection': {
      backgroundColor: variables.selection.background,
    },
  }

  return (
    <EmotionThemeProvider theme={variables}>
      <Global styles={globalStylesFromTheme} />
      {props.children}
    </EmotionThemeProvider>
  )
})
