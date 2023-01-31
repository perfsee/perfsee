import { escapeRegExp } from 'lodash'

export type WebhookMethod = 'POST'

export function parseWebhookEventTypeWildcardExpr(expr: string) {
  const itemRegex = []
  for (const item of expr.split(',')) {
    const trimmed = item.trim()
    if (trimmed) {
      itemRegex.push(escapeRegExp(trimmed).replace(/\\\*/g, '.*'))
    }
  }

  return new RegExp(`^(${itemRegex.join('|')})$`)
}

export const WEBHOOK_EVENT_TYPE = [
  { key: 'bundle:finished', name: 'Bundle finished', description: 'Bundle analyze is finished' },
  { key: 'lab:snapshot-completed', name: 'Snapshot completed', description: 'Snapshot is completed' },
  {
    key: 'lab:snapshot-report-completed',
    name: 'Snapshot report completed',
    description: 'Snapshot report is completed.',
  },
  { key: 'source:finished', name: 'Source finished', description: 'Source analyze is finished' },
] as const

export type WebhookEventType = typeof WEBHOOK_EVENT_TYPE[number]
