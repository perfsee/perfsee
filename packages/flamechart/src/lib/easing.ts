/**
 * @param t current time from 0 to 1.0
 * @param b begin value
 * @param c change to value
 */
 export function easeInOutQuad(t: number, b: number, c: number) {
  if (t === 1 || b === c) { return c; }
  c -= b;
  t /= 1 / 2;
  if ((t) < 1) { return c / 2 * t * t + b; }
  return -c / 2 * ((--t) * (t - 2) - 1) + b;
}

/**
 * @param t current time from 0 to 1.0
 * @param b begin value
 * @param c change to value
 */
 export function easeInOutCubic(t: number, b: number, c: number) {
  if (t === 1 || b === c) { return c; }
  c -= b;
  t /= 1 / 2;
  if (t < 1) { return c / 2 * t * t * t + b; }
  return c / 2 * ((t -= 2) * t * t + 2) + b;
}