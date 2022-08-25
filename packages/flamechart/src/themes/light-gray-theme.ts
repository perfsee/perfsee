import { Color } from '../lib/color'

import { lightTheme } from './light-theme'
import { Theme } from './theme'

const colorForBucket = (_: number) => {
  const H = 360.0
  const C = 0
  const L = 0.9
  return Color.fromLumaChromaHue(L, C, H)
}
const colorForBucketGLSL = `
  vec3 colorForBucket(float t) {
    float H = 360.0;
    float C = 0.0;
    float L = 0.9;
    return hcl2rgb(H, C, L);
  }
`

export const lightGrayTheme: Theme = {
  ...lightTheme,
  colorForBucket,
  colorForBucketGLSL,
}
