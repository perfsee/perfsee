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

import { Theme } from '@emotion/react'
import { NeutralColors, SharedColors } from '@fluentui/theme'

export const enum Brightness {
  Dark,
  Bright,
  System,
}

export const ConstantColors = {
  // https://www.schemecolor.com/gitlab-logo-colors.php
  gitlab: {
    SpanishGray: '#8c929d',
    CGRed: '#e2432a',
    OrangeRed: '#fc6d27',
    Crayola: '#fca326',
    Purple: '#6f42c1',
  },
}

export const BrightTheme: Theme = {
  colors: {
    primary: SharedColors.cyanBlue10,
    secondary: NeutralColors.gray40,
    success: SharedColors.greenCyan10,
    warning: '#FF7D00',
    error: SharedColors.red10,
    running: SharedColors.cyanBlue10,
    disabled: NeutralColors.gray70,
    primaryBackground: '#f6f7fb',
    appCrashedBackground: SharedColors.cyanBlue10,
    white: NeutralColors.white,
  },
  nav: {
    hoverColor: NeutralColors.white,
    focusColor: NeutralColors.white,
    activeColor: NeutralColors.white,
  },
  link: {
    color: '#0078d4',
    hoverColor: '#004578',
    activeColor: '#004578',
    focusColor: '#0078d4',
    visitedColor: '#0078d4',
  },
  selection: {
    background: 'rgba(141, 214, 249, 0.35)',
  },
  text: {
    fontFamily: `-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji"`,
    fontSize: '14px',
    color: NeutralColors.gray150,
    colorSecondary: NeutralColors.gray90,
    colorInWaringBlock: NeutralColors.gray200,
    appCrashedColor: NeutralColors.white,
  },
  tag: {
    success: {
      color: SharedColors.green10,
      backgroundColor: '#E8FFEA',
    },
    error: {
      color: SharedColors.red10,
    },
    warning: {
      color: '#FF7D00',
    },
    info: {
      color: SharedColors.cyanBlue10,
    },
    default: {
      color: NeutralColors.black,
      backgroundColor: NeutralColors.gray40,
      borderColor: NeutralColors.gray60,
    },
  },
  border: {
    radius: '4px',
    color: NeutralColors.gray40,
  },
  boxShadowBase: '0 1.6px 3.6px 0 rgba(0,0,0,.132), 0 0.3px 0.9px 0 rgba(0,0,0,.108)',

  markdown: {
    blockquote: {
      color: '#4e7182',
      backgroundColor: '#eaf8ff',
    },
    inlineCode: {
      color: 'hotpink',
      background: 'rgba(70, 94, 105, 0.05)',
    },
  },

  layout: {
    mainPadding: '80px',
    headerHeight: '60px',
    sideBarWidth: '200px',
  },
}

// eslint-disable-next-line @typescript-eslint/ban-types
export type DeepPartial<T> = T extends Function ? T : T extends object ? { [P in keyof T]?: DeepPartial<T[P]> } : T

export function copyTheme(theme: Theme, variables: DeepPartial<Theme> = {}): Theme {
  return mergeTheme<Theme>(theme, variables)
}

function mergeTheme<T>(target: T, data: DeepPartial<T>): T {
  const dest: T = Object.create(null)
  for (const [key, value] of Object.entries(target)) {
    const newProperty = data[key]
    if (typeof newProperty === 'object') {
      dest[key] = mergeTheme(value, newProperty)
    } else {
      dest[key] = data[key] ?? value
    }
  }
  return dest
}

export function createTheme(variables: DeepPartial<Theme>) {
  return copyTheme(BrightTheme, variables)
}
