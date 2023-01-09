import { Effect, EffectModule, ImmerReducer, Module } from '@sigi/core'
import { Draft } from 'immer'
import { endWith, filter, map, Observable, startWith, switchMap, withLatestFrom } from 'rxjs'

import { createErrorCatcher, GraphQLClient } from '@perfsee/platform/common'
import {
  createWebhookForProjectMutation,
  createWebhookForApplicationMutation,
  deleteWebhookMutation,
  updateWebhookMutation,
  WebhookInput,
  webhooksByProjectQuery,
  WebhooksByProjectQuery,
  webhooksByApplicationQuery,
} from '@perfsee/schema'

import { ProjectModule } from '../shared'

export type Webhook = WebhooksByProjectQuery['project']['webhooks'][number]
export type WebhookSchema = WebhookInput

interface State {
  webhooks: Webhook[]
  loading: boolean
}

@Module('WebhookModule')
export class WebhookModule extends EffectModule<State> {
  readonly defaultState = {
    webhooks: [],
    loading: true,
  }

  constructor(private readonly client: GraphQLClient, private readonly projectModule: ProjectModule) {
    super()
  }

  @Effect()
  fetchCurrentProjectWebhooks(payload$: Observable<void>) {
    return payload$.pipe(
      withLatestFrom(this.projectModule.state$),
      filter(([, { project }]) => !!project?.id),
      switchMap(([, { project }]) =>
        this.client
          .query({
            query: webhooksByProjectQuery,
            variables: {
              projectId: project!.id,
            },
          })
          .pipe(
            map((data) => this.getActions().setWebhooks(data.project.webhooks)),
            createErrorCatcher('Failed to fetch webhooks'),
            startWith(this.getActions().setLoading(true)),
            endWith(this.getActions().setLoading(false)),
          ),
      ),
    )
  }

  @Effect()
  fetchApplicationWebhooks(payload$: Observable<{ appId: number }>) {
    return payload$.pipe(
      switchMap(({ appId }) =>
        this.client
          .query({
            query: webhooksByApplicationQuery,
            variables: {
              applicationId: appId,
            },
          })
          .pipe(
            map((data) => this.getActions().setWebhooks(data.application.webhooks)),
            createErrorCatcher('Failed to fetch webhooks'),
            startWith(this.getActions().setLoading(true)),
            endWith(this.getActions().setLoading(false)),
          ),
      ),
    )
  }

  @Effect()
  createWebhookForCurrentProject(payload$: Observable<WebhookSchema>) {
    return payload$.pipe(
      withLatestFrom(this.projectModule.state$),
      filter(([, { project }]) => !!project?.id),
      switchMap(([webhook, { project }]) =>
        this.client
          .query({
            query: createWebhookForProjectMutation,
            variables: {
              input: webhook,
              projectId: project!.id,
            },
          })
          .pipe(
            map((data) => this.getActions().addWebhook(data.createWebhookForProject)),
            createErrorCatcher('Failed to create webhook'),
          ),
      ),
    )
  }

  @Effect()
  createWebhookForApplication(payload$: Observable<{ appId: number; input: WebhookSchema }>) {
    return payload$.pipe(
      switchMap(({ appId, input }) =>
        this.client
          .query({
            query: createWebhookForApplicationMutation,
            variables: {
              input,
              applicationId: appId,
            },
          })
          .pipe(
            map((data) => this.getActions().addWebhook(data.createWebhookForApplication)),
            createErrorCatcher('Failed to create webhook'),
          ),
      ),
    )
  }

  @Effect()
  deleteWebhook(payload$: Observable<{ webhookId: string }>) {
    return payload$.pipe(
      switchMap(({ webhookId }) =>
        this.client
          .query({
            query: deleteWebhookMutation,
            variables: {
              webhookId,
            },
          })
          .pipe(
            map(() => this.getActions().removeWebhook(webhookId)),
            createErrorCatcher('Failed to delete webhook'),
          ),
      ),
    )
  }

  @Effect()
  updateWebhook(payload$: Observable<{ webhookId: string; input: WebhookSchema }>) {
    return payload$.pipe(
      switchMap(({ webhookId, input }) =>
        this.client
          .query({
            query: updateWebhookMutation,
            variables: {
              webhookId,
              input,
            },
          })
          .pipe(
            map((data) => this.getActions().changeWebhook(data.updateWebhook)),
            createErrorCatcher('Failed to update webhook'),
          ),
      ),
    )
  }

  @ImmerReducer()
  setLoading(state: Draft<State>, loading: boolean) {
    state.loading = loading
  }

  @ImmerReducer()
  setWebhooks(state: Draft<State>, webhooks: Webhook[]) {
    state.webhooks = webhooks
  }

  @ImmerReducer()
  removeWebhook(state: Draft<State>, webhookId: string) {
    state.webhooks = state.webhooks.filter((webhook) => webhook.id !== webhookId)
  }

  @ImmerReducer()
  changeWebhook(state: Draft<State>, newWebhook: Webhook) {
    const index = state.webhooks.findIndex((webhook) => webhook.id === newWebhook.id)
    if (index >= 0) {
      state.webhooks[index] = newWebhook
    }
  }

  @ImmerReducer()
  addWebhook(state: Draft<State>, webhook: Webhook) {
    state.webhooks.push(webhook)
  }
}
