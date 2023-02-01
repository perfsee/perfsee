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

import { Observable, Observer } from 'rxjs'
import Sinon from 'sinon'

import { Application, Project, User } from '@perfsee/platform-server/db'
import { RxFetch } from '@perfsee/platform-server/helpers'
import test, { createMock, initTestDB, createDBTestingModule, create } from '@perfsee/platform-server/test'

import { WebhookService } from '../service'

let application: Application
let project: Project
test.beforeEach(async (t) => {
  t.context.module = await createDBTestingModule({
    providers: [WebhookService],
  })
    .useMocker(createMock)
    .compile()

  await initTestDB()

  application = await create(User, {
    isApp: true,
  })
  project = await Project.findOneByOrFail({ id: 1 })
})

test.serial('Create webhook', async (t) => {
  const service = t.context.module.get(WebhookService)
  const webhook = {
    url: 'http://example.com/payload',
    method: 'POST',
    eventType: '*',
  }

  {
    const createdWebhook = await service.createWebhook(webhook, null, project.id)

    const webhooksByProject = await service.getWebhooksByProject(project.id)
    t.is(webhooksByProject.length, 1)
    t.is(createdWebhook.uuid, webhooksByProject[0].uuid)
  }

  {
    const createdWebhook = await service.createWebhook(webhook, application.id, null)

    const webhooksByUser = await service.getWebhooksByUser(application.id)
    t.is(webhooksByUser.length, 1)
    t.is(createdWebhook.uuid, webhooksByUser[0].uuid)
  }

  await t.throwsAsync(async () => {
    await service.createWebhook(webhook, null, null)
  })
})

test.serial('deliver webhook', async (t) => {
  const eventType = 'a'
  const payload = { hello: 'world' }
  const service = t.context.module.get(WebhookService)
  const fetch = t.context.module.get(RxFetch)

  await service.createWebhook(
    {
      url: 'http://example.com/payload',
      method: 'POST',
      eventType: '*',
      secret: '123',
    },
    null,
    project.id,
  )

  {
    const stubSubscribe = Sinon.stub().callsFake((o: Observer<any>) => {
      o.next({ status: 200 })
      o.complete()
    })
    fetch.post.returns(new Observable(stubSubscribe))
    const result = await service.deliverRaw(eventType, payload, project)

    t.true(fetch.post.calledOnce)
    t.is(fetch.post.firstCall.args[0], 'http://example.com/payload')
    t.deepEqual(JSON.parse(fetch.post.firstCall.args[1]!.body as string), { eventType, payload })
    t.is(
      fetch.post.firstCall.args[1]!.headers!['X-Perfsee-Signature-256'],
      `sha256=${createHmac('sha256', '123')
        .update(fetch.post.firstCall.args[1]!.body as string)
        .digest('hex')}`,
    )
    t.true(stubSubscribe.calledOnce)
    t.is(result?.length, 1)
    t.is(result?.[0].status, 'fulfilled')

    fetch.post.resetHistory()
  }

  // retry
  {
    const stubSubscribe = Sinon.stub()
    stubSubscribe.onFirstCall().callsFake((o: Observer<any>) => o.error('error'))
    stubSubscribe.onSecondCall().callsFake((o: Observer<any>) => o.error('error'))
    stubSubscribe.onThirdCall().callsFake((o: Observer<any>) => {
      o.next({ status: 200 })
      o.complete()
    })
    fetch.post.returns(new Observable(stubSubscribe))
    const result = await service.deliverRaw(eventType, payload, project)

    t.true(stubSubscribe.calledThrice)
    t.is(result?.length, 1)
    t.is(result?.[0].status, 'fulfilled')

    fetch.post.resetHistory()
  }

  // timeout
  {
    const timer = Sinon.useFakeTimers()
    const stubSubscribe = Sinon.stub().callsFake(() => {
      timer.tickAsync(30000)
    })
    fetch.post.returns(new Observable(stubSubscribe))
    const result = await service.deliverRaw(eventType, payload, project)

    t.true(stubSubscribe.calledOnce)
    t.is(result?.length, 1)
    t.is(result?.[0].status, 'rejected')

    fetch.post.resetHistory()
  }

  // error status code
  {
    const stubSubscribe = Sinon.stub().callsFake((o: Observer<any>) => {
      o.next({ status: 500 })
      o.complete()
    })
    fetch.post.returns(new Observable(stubSubscribe))
    const result = await service.deliverRaw(eventType, payload, project)

    t.true(stubSubscribe.calledOnce)
    t.is(result?.length, 1)
    t.is(result?.[0].status, 'rejected')

    fetch.post.resetHistory()
  }
})
