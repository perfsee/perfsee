import { Color } from '../lib/color'

import { lightTheme } from './light-theme'
import { Theme } from './theme'

const C_0 = 0.7
const C_d = 0.5
const L_0 = 0.86
const L_d = 0.25

const colorForBucket = (t: number) => {
  if (t < 0.004) {
    const H = 360.0
    const C = 0.0
    const L = 0.9
    return Color.fromLumaChromaHue(H, C, L)
  }
  if (t < 0.008) {
    const H = 360.0
    const C = 0.0
    const L = 0.75
    return Color.fromLumaChromaHue(H, C, L)
  }
  const H = 190.0 - 160.0 * Math.pow(t, 0.6)
  const C = C_0 - C_d * (1.0 - Math.pow(t, 0.7))
  const L = L_0 - L_d * (1.0 - Math.pow(t, 0.6))
  return Color.fromLumaChromaHue(H, C, L)
}
const colorForBucketGLSL = `
  vec3 colorForBucket(float t) {
    if (t < 0.004) {
      float H = 360.0;
      float C = 0.0;
      float L = 0.9;
      return hcl2rgb(H, C, L);
    }
    if (t < 0.008) {
      float H = 360.0;
      float C = 0.0;
      float L = 0.75;
      return hcl2rgb(H, C, L);
    }
    float H = 190.0 - 160.0 * pow(t, 0.6);
    float C = ${C_0.toFixed(2)} - ${C_d.toFixed(2)} * (1.0 - pow(t, 0.7));
    float L = ${L_0.toFixed(2)} - ${L_d.toFixed(2)} * (1.0 - pow(t, 0.6));
    return hcl2rgb(H, C, L);
  }
`

/**
 * A variant of the light color theme, the higher the colorForBucket value, the more eye-catching the node color
 */
export const lightWeightTheme: Theme = {
  ...lightTheme,
  colorForBucket,
  colorForBucketGLSL,
}
