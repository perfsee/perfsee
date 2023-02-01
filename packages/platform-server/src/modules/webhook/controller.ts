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

import { Controller } from '@nestjs/common'

import { Project } from '@perfsee/platform-server/db'
import { OnEvent } from '@perfsee/platform-server/event'
import { WebhookEventParameters } from '@perfsee/platform-server/event/webhook-events'

import { WebhookService } from './service'

@Controller()
export class WebhookController {
  constructor(private readonly service: WebhookService) {}

  @OnEvent('webhook.deliver')
  async onDeliverWebhook(project: Project, parameters: WebhookEventParameters) {
    await this.service.deliver(project, parameters.eventType, parameters)
  }
}
