import {
  bundleFinishedEventQuery,
  GraphQLQuery,
  labSnapshotCompletedEventQuery,
  labSnapshotReportCompletedEventQuery,
  QueryResponse,
  sourceFinishedEventQuery,
} from '@perfsee/schema'
import { WebhookEventType } from '@perfsee/shared'

import type { RequestOptions } from '../graphql'
import type { GqlService } from '../graphql.module'

function buildWebhookPayloadFactories<
  T extends {
    [K in WebhookEventType['key']]: GraphQLQuery
  },
>(schema: T) {
  const result: any = {}
  for (const key in schema) {
    result[key] = async (gqlService: GqlService, variables: any) => {
      const data = await gqlService.query({
        query: schema[key] as any,
        variables,
      })
      return {
        data,
        variables,
      }
    }
  }

  return result as {
    [K in WebhookEventType['key']]: (
      gqlService: GqlService,
      variables: RequestOptions<T[K]>['variables'],
    ) => Promise<{
      data: QueryResponse<T[K]>
      variables: RequestOptions<T[K]>['variables']
    }>
  }
}

export const WebhookEventPayloadFactories = buildWebhookPayloadFactories({
  'bundle:finished': bundleFinishedEventQuery,
  'lab:snapshot-completed': labSnapshotCompletedEventQuery,
  'lab:snapshot-report-completed': labSnapshotReportCompletedEventQuery,
  'source:finished': sourceFinishedEventQuery,
})

type ValueOf<T> = T[keyof T]

export type WebhookEventParameters = ValueOf<{
  [K in keyof typeof WebhookEventPayloadFactories]: { eventType: K } & Parameters<
    typeof WebhookEventPayloadFactories[K]
  >[1]
}>
