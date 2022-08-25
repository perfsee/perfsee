import { Color } from '../lib/color'

export { darkTheme } from './dark-theme'
export { lightTheme } from './light-theme'
export { lightGrayTheme } from './light-gray-theme'

export interface Theme {
  fgPrimaryColor: string
  fgSecondaryColor: string

  linkColor: string

  borderColor: string

  bgPrimaryColor: string
  bgSecondaryColor: string

  altFgPrimaryColor: string
  altFgSecondaryColor: string
  altBgPrimaryColor: string
  altBgSecondaryColor: string

  selectionPrimaryColor: string
  selectionSecondaryColor: string

  weightColor: string

  searchMatchTextColor: string
  searchMatchPrimaryColor: string
  searchMatchSecondaryColor: string

  WarningColor: string
  WarningBgColor: string

  colorForBucket: (t: number) => Color
  colorForBucketGLSL: string

  fontFamily: string
}
