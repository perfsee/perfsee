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

import { createHmac } from 'crypto'

import { Injectable } from '@nestjs/common'
import { Response } from 'node-fetch'
import { lastValueFrom, retry, timeout } from 'rxjs'
import { In } from 'typeorm'
import { v4 as uuid } from 'uuid'

import { Project, Webhook } from '@perfsee/platform-server/db'
import { UserError } from '@perfsee/platform-server/error'
import { RequestOptions } from '@perfsee/platform-server/graphql'
import { GqlService } from '@perfsee/platform-server/graphql.module'
import { RxFetch } from '@perfsee/platform-server/helpers'
import { Logger } from '@perfsee/platform-server/logger'
import { Redis } from '@perfsee/platform-server/redis'
import {
  bundleFinishedEventQuery,
  GraphQLQuery,
  labSnapshotCompletedEventQuery,
  labSnapshotReportCompletedEventQuery,
  QueryResponse,
  sourceFinishedEventQuery,
} from '@perfsee/schema'
import { parseWebhookEventTypeWildcardExpr, WebhookEventType } from '@perfsee/shared'

import { ApplicationService } from '../application/service'

import { DeliveryRecord, WebhookInput } from './resolver'

const WEBHOOK_LAST_DELIVERY_KEY = 'WEBHOOK_LAST_DELIVERY'

const payloadFactories = buildWebhookPayloadFactories({
  'bundle:finished': bundleFinishedEventQuery,
  'lab:snapshot-completed': labSnapshotCompletedEventQuery,
  'lab:snapshot-report-completed': labSnapshotReportCompletedEventQuery,
  'source:finished': sourceFinishedEventQuery,
})

@Injectable()
export class WebhookService {
  constructor(
    private readonly logger: Logger,
    private readonly applicationService: ApplicationService,
    private readonly rxFetch: RxFetch,
    private readonly redis: Redis,
    private readonly gqlService: GqlService,
  ) {}

  async deliver<EventType extends keyof typeof payloadFactories>(
    project: Project,
    eventType: EventType,
    variables: Parameters<typeof payloadFactories[EventType]>[1],
  ) {
    try {
      this.logger.debug(`deliver webhook ${eventType}, project: ${project.slug}`, variables)
      const payload = await payloadFactories[eventType](this.gqlService, variables)
      await this.deliverRaw(eventType, payload, project)
    } catch (e) {
      this.logger.error(`deliver webhook error ${e instanceof Error ? e.stack : e}`)
    }
  }

  async deliverRaw(
    eventType: string,
    payload: any,
    project: Project,
    callback?: (results: PromiseSettledResult<void>[]) => void /* for test */,
  ) {
    const deliveryUuid = uuid()

    const projectWebhooks = await this.getWebhooksByProject(project.id)

    const applications = await this.applicationService.getAuthorizedApplications(project.id)
    const applicationWebhooks = await Webhook.find({
      where: {
        userId: In(applications.map((app) => app.app.id)),
      },
    })

    const webhooks = [
      ...projectWebhooks.filter((hook) => parseWebhookEventTypeWildcardExpr(hook.eventType).test(eventType)),
      ...applicationWebhooks.filter((hook) => parseWebhookEventTypeWildcardExpr(hook.eventType).test(eventType)),
    ]

    const headers = {
      Accept: '*/*',
      'content-type': 'application/json',
      'User-Agent': 'Perfsee-Hookshot/1',
      'X-Perfsee-Delivery': deliveryUuid,
      'X-Perfsee-Event': eventType,
      'X-Perfsee-Hook-Project': project.slug,
    }

    const body = JSON.stringify({ eventType, payload })

    const deliveryJob = Promise.allSettled(
      webhooks.map(async (hook) => {
        const finalHeaders = { ...headers, 'X-Perfsee-Hook-ID': hook.uuid }
        if (hook.secret) {
          finalHeaders['X-Perfsee-Signature-256'] = `sha256=${createHmac('sha256', hook.secret)
            .update(body)
            .digest('hex')}`
        }
        const startTime = new Date()
        this.logger.debug(`deliver webhook to ${hook.url}`)
        let response
        try {
          response = await lastValueFrom(
            this.rxFetch
              .post<Response>(hook.url, {
                raw: true,
                headers: finalHeaders,
                body,
              })
              .pipe(retry(2), timeout(30000 /* 30s */)),
          )
        } catch (err) {
          this.logger.error(`failed to deliver webhook to ${hook.url}, ${err instanceof Error ? err.stack : err}`)
        }
        const endTime = new Date()

        const statusCode = response?.status
        const isSuccess = statusCode ? statusCode >= 200 && statusCode < 300 : false

        this.logger.debug(
          `deliver webhook to ${hook.url} ${isSuccess ? 'successful' : 'failed'}, statusCode: ${statusCode}`,
        )

        await this.recordLastDelivery(hook.uuid, {
          deliveryId: deliveryUuid,
          startTime,
          endTime,
          isSuccess,
          statusCode,
        })

        if (!isSuccess) {
          throw new UserError("The user's webhook server returned an incorrect status code")
        }
      }),
    )

    deliveryJob
      .then((results) => {
        if (callback) {
          callback(results)
        }
      })
      .catch((_err) => {
        //
      })
  }

  createWebhook(webhook: WebhookInput, userId?: number | null, projectId?: number | null) {
    if (!userId && !projectId) {
      throw new UserError('Webhook must belong to a project or user')
    }

    return Webhook.create<Webhook>({ ...this.verifyWebhookInput(webhook), uuid: uuid(), userId, projectId }).save()
  }

  updateWebhook(webhookId: string, webhookInput: WebhookInput) {
    const webhook = this.verifyWebhookInput(webhookInput)

    return Webhook.update<Webhook>({ uuid: webhookId }, { ...webhook })
  }

  deleteWebhook(webhookId: string) {
    return Webhook.delete({ uuid: webhookId })
  }

  verifyWebhookInput(webhook: WebhookInput): Partial<Webhook> {
    const url = webhook.url.trim()
    if (!url) {
      throw new UserError("Webhook url can't be empty.")
    }

    if (webhook.contentType !== 'application/json') {
      throw new UserError('Webhook content type not support.')
    }

    if (webhook.method !== 'POST') {
      throw new UserError('Webhook method not support.')
    }

    return {
      url,
      contentType: webhook.contentType,
      method: webhook.method,
      secret: webhook.secret,
      eventType: webhook.eventType,
    }
  }

  getWebhooksByProject(projectId: number): Promise<Webhook[]> {
    return Webhook.findBy({
      projectId,
    })
  }

  getWebhooksByUser(userId: number): Promise<Webhook[]> {
    return Webhook.findBy({
      userId,
    })
  }

  getWebhookByUuid(uuid: string): Promise<Webhook> {
    return Webhook.findOneByOrFail({
      uuid,
    })
  }

  async recordLastDelivery(webhookId: string, record: DeliveryRecord) {
    await this.redis.set(
      `${WEBHOOK_LAST_DELIVERY_KEY}_${webhookId}`,
      JSON.stringify({ ...record, startTime: record.startTime.toISOString(), endTime: record.endTime.toISOString() }),
    )
  }

  async getLastDelivery(webhookId: string): Promise<DeliveryRecord | null> {
    const json = await this.redis.get(`${WEBHOOK_LAST_DELIVERY_KEY}_${webhookId}`)

    const data = json ? JSON.parse(json) : null

    return data
      ? {
          ...data,
          startTime: new Date(data.startTime),
          endTime: new Date(data.endTime),
        }
      : null
  }
}

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
