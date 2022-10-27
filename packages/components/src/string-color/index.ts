import { SharedColors } from '@fluentui/react'

export function getStringColor(text: string) {
  let c = 0
  for (const char of text) {
    c = c ^ char.codePointAt(0)!
  }

  const colors = Object.keys(SharedColors)
    .filter((n) => n.endsWith('10'))
    .map((n) => SharedColors[n])
  return colors[c % colors.length]
}
