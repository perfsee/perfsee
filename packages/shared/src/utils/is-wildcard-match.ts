import { escapeRegExp } from 'lodash'

function transform(segment: string) {
  let result = ''
  for (const char of segment) {
    if (char === '?') {
      result += '.'
    } else if (char === '*') {
      result += '.*?'
    } else {
      result += escapeRegExp(char)
    }
  }
  return result
}

export const isMatch = (pattern: string, sample: string) => {
  try {
    const regexpPattern = transform(pattern)
    const regexp = new RegExp(`^${regexpPattern}$`)
    return regexp.test(sample)
  } catch {
    return false
  }
}
