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

export type TagType = 'success' | 'error' | 'warning' | 'info' | 'default'

declare module '@emotion/react' {
  export interface Theme {
    colors: {
      primary: string
      secondary: string
      success: string
      warning: string
      error: string
      running: string
      disabled: string
      primaryBackground: string
      appCrashedBackground: string
      white: string
    }
    nav: {
      hoverColor: string
      focusColor: string
      activeColor: string
    }
    link: {
      color: string
      activeColor: string
      hoverColor: string
      focusColor: string
      visitedColor: string
    }
    selection: {
      background: string
    }
    text: {
      fontFamily: string
      color: string
      colorSecondary: string
      colorInWaringBlock: string
      fontSize: string
      appCrashedColor: string
    }
    border: {
      radius: string
      color: string
    }
    tag: {
      [K in TagType]: {
        color: string
        backgroundColor?: string
        borderColor?: string
      }
    }
    boxShadowBase: string
    markdown: {
      blockquote: {
        color: string
        backgroundColor: string
      }
      inlineCode: {
        color: string
        background: string
      }
    }
    layout: {
      mainPadding: string
      mainMaxWidth: string
      headerHeight: string
      sideBarWidth: string
    }
  }
}
