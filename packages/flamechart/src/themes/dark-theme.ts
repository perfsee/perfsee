import { Color } from '../lib/color'
import { triangle } from '../lib/utils'

import { Theme } from './theme'

// These colors are intentionally not exported from this file, because these
// colors are theme specific, and we want all color values to come from the
// active theme.
enum Colors {
  LIGHTER_GRAY = '#D0D0D0',
  LIGHT_GRAY = '#BDBDBD',
  GRAY = '#666666',
  DARK_GRAY = '#222222',
  DARKER_GRAY = '#0C0C0C',
  OFF_BLACK = '#060606',
  BLACK = '#000000',
  BLUE = '#00769B',
  PALE_BLUE = '#004E75',
  GREEN = '#0F8A42',
  LIGHT_BROWN = '#D6AE24',
  BROWN = '#A66F1C',
  SECONDARY = '#BDBDBD',
}

const C_0 = 0.2
const C_d = 0.1
const L_0 = 0.2
const L_d = 0.1

const colorForBucket = (t: number) => {
  const x = triangle(30.0 * t)
  const H = 360.0 * (0.9 * t)
  const C = C_0 + C_d * x
  const L = L_0 - L_d * x
  return Color.fromLumaChromaHue(L, C, H)
}
const colorForBucketGLSL = `
  vec3 colorForBucket(float t) {
    float x = triangle(30.0 * t);
    float H = 360.0 * (0.9 * t);
    float C = ${C_0.toFixed(1)} + ${C_d.toFixed(1)} * x;
    float L = ${L_0.toFixed(1)} - ${L_d.toFixed(1)} * x;
    return hcl2rgb(H, C, L);
  }
`

export const darkTheme: Theme = {
  fgPrimaryColor: Colors.LIGHTER_GRAY,
  fgSecondaryColor: Colors.SECONDARY,

  linkColor: '#3794ff',

  borderColor: 'hsl(0deg 0% 50% / 20%)',

  bgPrimaryColor: Colors.OFF_BLACK,
  bgSecondaryColor: Colors.DARK_GRAY,

  altFgPrimaryColor: Colors.LIGHTER_GRAY,
  altFgSecondaryColor: Colors.GRAY,

  altBgPrimaryColor: Colors.BLACK,
  altBgSecondaryColor: Colors.DARKER_GRAY,

  selectionPrimaryColor: Colors.BLUE,
  selectionSecondaryColor: Colors.PALE_BLUE,

  weightColor: Colors.GREEN,

  searchMatchTextColor: Colors.DARKER_GRAY,
  searchMatchPrimaryColor: Colors.BROWN,
  searchMatchSecondaryColor: Colors.LIGHT_BROWN,

  WarningColor: 'rgb(176,0,32)',
  WarningBgColor: 'rgba(176,0,32, 0.2)',

  colorForBucket,
  colorForBucketGLSL,

  fontFamily: `"-apple-system", "Segoe UI", "Helvetica Neue", Arial,"Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", Roboto, monospace`,
}
