import { faker } from '@faker-js/faker'

import {
  Page,
  PageWithCompetitor,
  PageWithProfile,
  PageWithEnv,
  Profile,
  Environment,
} from '@perfsee/platform-server/db'
import { seedProjectProperty } from '@perfsee/platform-server/db/fixtures'
import { InternalIdService } from '@perfsee/platform-server/helpers'
import test, { createMock, initTestDB, createDBTestingModule, create } from '@perfsee/platform-server/test'

import { SnapshotReportService } from '../../snapshot/snapshot-report/service'
import { PageService } from '../service'
import { CreatePageInput } from '../types'

test.beforeEach(async (t) => {
  t.context.module = await createDBTestingModule({
    providers: [PageService, SnapshotReportService],
  })
    .useMocker(createMock)
    .compile()

  await initTestDB()
})

test.serial('get page by iid', async (t) => {
  const created = await create(Page)

  const service = t.context.module.get(PageService)
  const page = await service.getPage(created.projectId, created.iid)

  t.deepEqual(created, page)
})

test.serial('get pages', async (t) => {
  await seedProjectProperty(1)
  const service = t.context.module.get(PageService)
  const pages = await service.getPages(1)

  t.is(pages.length, 5)
})

test.serial('get page relations', async (t) => {
  await seedProjectProperty(1)
  const service = t.context.module.get(PageService)
  const relations = await service.getPageRelations(1)

  t.is(relations.length, 4)
})

test.serial('get pages with property', async (t) => {
  const [pages, envs, profiles] = await seedProjectProperty(1)
  const service = t.context.module.get(PageService)
  const payload1 = await service.getPageWithProperty(1)
  const payload2 = await service.getPageWithProperty(1, [pages[3].iid])
  const payload3 = await service.getPageWithProperty(1, undefined, [profiles[1].iid], [envs[1].iid])
  const payload4 = await service.getPageWithProperty(1, [pages[1].iid], [profiles[1].iid], [envs[1].iid])

  t.is(payload1.pages.length, 3)
  t.is(payload1.propertyIds.length, 5)

  t.is(payload2.pages.length, 0)
  t.is(payload2.propertyIds.length, 0)

  t.is(payload3.pages.length, 3)
  t.is(payload3.propertyIds.length, 2)

  t.is(payload4.pages.length, 1)
  t.is(payload4.propertyIds.length, 1)
})

test.serial('get pages with property when page is disabled', async (t) => {
  const [pages] = await seedProjectProperty(1)
  const service = t.context.module.get(PageService)
  const payload = await service.getPageWithProperty(1, [pages.find((p) => p.disable)!.iid])

  t.is(payload.pages.length, 0)
  t.is(payload.propertyIds.length, 0)
})

test.serial('create page without url', async (t) => {
  const service = t.context.module.get(PageService)
  const payload = {} as CreatePageInput

  await t.throwsAsync(
    async () => {
      await service.updateOrCreatePage(1, payload)
    },
    { instanceOf: Error, message: `[User Error] Required parameters: 'url' and 'name'` },
  )
})

test.serial('create normal page', async (t) => {
  const projectId = 1
  const competitor = await create(Page, { projectId, isCompetitor: true })
  const profile = await create(Profile, { projectId })
  const env = await create(Environment, { projectId })
  const internalIdService = t.context.module.get(InternalIdService)
  internalIdService.generate.resolves(1)

  const service = t.context.module.get(PageService)
  const payload = {
    profileIids: [profile.iid],
    envIids: [env.iid],
    competitorIids: [competitor.iid],
    url: faker.internet.url(),
    name: faker.word.noun(),
  } as CreatePageInput

  const page = await service.updateOrCreatePage(projectId, payload)
  const pageWithProfile = await PageWithProfile.findBy({ pageId: page.id })
  const pageWithEnv = await PageWithEnv.findBy({ pageId: page.id })
  const pageWithCompetitor = await PageWithCompetitor.findBy({ pageId: page.id })

  t.is(payload.url, page.url)
  t.is(payload.name, page.name)
  t.is(page.iid, 1)

  t.is(pageWithCompetitor.length, 1)
  t.is(pageWithProfile.length, 1)
  t.is(pageWithEnv.length, 1)
  t.is(pageWithCompetitor[0].competitorId, competitor.id)
  t.is(pageWithProfile[0].profileId, profile.id)
  t.is(pageWithEnv[0].envId, env.id)
})

test.serial('create competitor page', async (t) => {
  const projectId = 1
  const page = await create(Page, { projectId })
  const internalIdService = t.context.module.get(InternalIdService)
  internalIdService.generate.resolves(1)

  const service = t.context.module.get(PageService)
  const payload = {
    connectPageIid: page.iid,
    url: faker.internet.url(),
    name: faker.word.noun(),
    isCompetitor: true,
  } as CreatePageInput

  const competitor = await service.updateOrCreatePage(projectId, payload)
  const pageWithCompetitor = await PageWithCompetitor.findBy({ competitorId: competitor.id })

  t.true(competitor.isCompetitor)
  t.is(payload.url, competitor.url)
  t.is(payload.name, competitor.name)
  t.is(competitor.iid, 1)

  t.is(pageWithCompetitor.length, 1)
  t.is(pageWithCompetitor[0].pageId, page.id)
})

test.serial('update page', async (t) => {
  const projectId = 1
  const page = await create(Page, { projectId })
  const env = await create(Environment, { projectId })
  const service = t.context.module.get(PageService)
  const payload = {
    envIids: [env.iid],
    competitorIids: [],
    name: faker.word.noun(),
    iid: page.iid,
  }

  const updatedPage = await service.updateOrCreatePage(projectId, payload)
  const pageWithEnv = await PageWithEnv.findBy({ pageId: page.id })
  const pageWithCompetitor = await PageWithCompetitor.findBy({ pageId: page.id })

  t.is(payload.name, updatedPage.name)

  t.is(pageWithCompetitor.length, 0)
  t.is(pageWithEnv.length, 1)
  t.is(pageWithEnv[0].envId, env.id)
})
