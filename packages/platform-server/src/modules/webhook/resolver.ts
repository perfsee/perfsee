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

import { ForbiddenException } from '@nestjs/common'
import {
  Args,
  Field,
  GraphQLISODateTime,
  ID,
  InputType,
  Int,
  Mutation,
  ObjectType,
  Parent,
  ResolveField,
  Resolver,
} from '@nestjs/graphql'

import { Application, Project, User, Webhook } from '@perfsee/platform-server/db'
import { UserError } from '@perfsee/platform-server/error'

import { ApplicationService } from '../application/service'
import { Auth, CurrentUser } from '../auth'
import { Permission, PermissionGuard, PermissionProvider } from '../permission'
import { ProjectService } from '../project/service'

import { WebhookService } from './service'

@InputType()
export class WebhookInput {
  @Field(() => String)
  url!: string

  @Field(() => String, { nullable: true })
  secret?: string

  @Field(() => String)
  method!: string

  @Field(() => String)
  eventType!: string
}

@ObjectType()
export class DeliveryRecord {
  @Field(() => GraphQLISODateTime)
  startTime!: Date

  @Field(() => GraphQLISODateTime)
  endTime!: Date

  @Field(() => Number, { nullable: true })
  statusCode?: number

  @Field(() => Boolean)
  isSuccess!: boolean

  @Field(() => ID)
  deliveryId!: string
}

@Auth()
@Resolver(() => Webhook)
export class WebhookResolver {
  constructor(
    private readonly service: WebhookService,
    private readonly projectService: ProjectService,
    private readonly applicationService: ApplicationService,
    private readonly permissionProvider: PermissionProvider,
  ) {}

  @ResolveField(() => DeliveryRecord, { name: 'lastDelivery', nullable: true })
  async lastDelivery(@Parent() webhook: Webhook) {
    return this.service.getLastDelivery(webhook.uuid)
  }

  @Mutation(() => Webhook, { name: 'createWebhookForProject' })
  @PermissionGuard(Permission.Admin, 'projectId')
  async createWebhookForProject(
    @Args({ name: 'projectId', type: () => ID }) projectId: string,
    @Args({ name: 'input' }) input: WebhookInput,
  ) {
    const project = await this.projectService.slugLoader.load(projectId)
    if (!project) {
      throw new UserError('Project not found')
    }
    return this.service.createWebhook(input, null, project?.id)
  }

  @Mutation(() => Webhook, { name: 'createWebhookForApplication' })
  async createWebhookForApplication(
    @CurrentUser() user: User,
    @Args({ name: 'applicationId', type: () => Int }) appId: number,
    @Args({ name: 'input' }) input: WebhookInput,
  ) {
    if (!user.isAdmin && user.id !== appId) {
      throw new ForbiddenException('No permission.')
    }
    const application = await this.applicationService.getApplication(appId)
    return this.service.createWebhook(input, application.id, null)
  }

  @Mutation(() => Webhook, { name: 'updateWebhook' })
  async updateWebhook(
    @CurrentUser() user: User,
    @Args({ name: 'id', type: () => ID }) id: string,
    @Args({ name: 'input' }) input: WebhookInput,
  ) {
    const webhook = await this.service.getWebhookByUuid(id)
    if (webhook.projectId && !(await this.permissionProvider.check(user, webhook.projectId, Permission.Admin))) {
      throw new ForbiddenException('No permission.')
    }

    if (webhook.userId && !user.isAdmin && user.id !== webhook.userId) {
      throw new ForbiddenException('No permission.')
    }

    return this.service.updateWebhook(id, input)
  }

  @Mutation(() => Boolean, { name: 'deleteWebhook' })
  async deleteWebhook(@CurrentUser() user: User, @Args({ name: 'id', type: () => ID }) id: string) {
    const webhook = await this.service.getWebhookByUuid(id)
    if (webhook.projectId && !(await this.permissionProvider.check(user, webhook.projectId, Permission.Admin))) {
      throw new ForbiddenException('No permission.')
    }

    if (webhook.userId && user.id !== webhook.userId) {
      throw new ForbiddenException('No permission.')
    }

    await this.service.deleteWebhook(id)

    return true
  }
}

@Resolver(() => Project)
export class ProjectWebhookResolver {
  constructor(private readonly service: WebhookService) {}

  @ResolveField(() => [Webhook], { name: 'webhooks', description: 'All webhooks in project' })
  webhooks(@Parent() project: Project) {
    return this.service.getWebhooksByProject(project.id)
  }
}

@Resolver(() => Application)
export class ApplicationWebhookResolver {
  constructor(private readonly service: WebhookService) {}

  @ResolveField(() => [Webhook], { name: 'webhooks' })
  webhooks(@Parent() application: Application) {
    return this.service.getWebhooksByUser(application.id)
  }
}
