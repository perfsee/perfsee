import { faker } from '@faker-js/faker'

import {
  Project,
  Page,
  PageWithEnv,
  PageWithProfile,
  Environment,
  PageWithCompetitor,
  Profile,
  User,
} from '@perfsee/platform-server/db'
import test, { GraphQLTestingClient, initTestDB, create } from '@perfsee/platform-server/test'
import {
  pagesQuery,
  deletePageMutation,
  pageRelationsQuery,
  createPageMutation,
  updatePageMutation,
} from '@perfsee/schema'

let gqlClient: GraphQLTestingClient
let slug: string
let user: User

test.before(async () => {
  await initTestDB()
  gqlClient = new GraphQLTestingClient()

  slug = (await Project.findOneByOrFail({ id: 1 })).slug
  user = await create(User)
})

test.serial('get pages', async (t) => {
  const page = await create(Page, { projectId: 1 })
  await create(Page, { projectId: 1 })

  const response = await gqlClient.query({
    query: pagesQuery,
    variables: { projectId: slug },
  })

  t.is(response.project.pages.length, 2)
  t.is(response.project.pages[0].id, page.iid)
})

test.serial('get page relations', async (t) => {
  const projectId = 1

  const page = await create(Page, { projectId })
  const competitor = await create(Page, { projectId, isCompetitor: true })

  const profile1 = await create(Profile, { projectId })
  const profile2 = await create(Profile, { projectId })
  const env = await create(Environment, { projectId })

  await create(PageWithCompetitor, { pageId: page.id, competitorId: competitor.id })
  await create(PageWithProfile, { pageId: page.id, profileId: profile1.id })
  await create(PageWithProfile, { pageId: page.id, profileId: profile2.id })
  await create(PageWithProfile, { pageId: competitor.id, profileId: profile1.id })
  await create(PageWithEnv, { pageId: page.id, envId: env.id })

  const response = await gqlClient.query({
    query: pageRelationsQuery,
    variables: { projectId: slug },
  })

  t.is(response.project.pageRelations.length, 4)
  t.is(response.project.pageRelations[2].pageId, page.iid)
  t.deepEqual(response.project.pageRelations[2].envIds, [env.iid])
  t.deepEqual(response.project.pageRelations[2].profileIds, [profile1.iid, profile2.iid])
  t.deepEqual(response.project.pageRelations[2].competitorIds, [competitor.iid])

  t.is(response.project.pageRelations[3].pageId, competitor.iid)
  t.is(response.project.pageRelations[3].envIds.length, 0)
  t.deepEqual(response.project.pageRelations[3].profileIds, [profile1.iid])
})

test.serial('create page', async (t) => {
  const env = await create(Environment)
  const profile = await create(Profile)

  const response = await gqlClient.query({
    query: createPageMutation,
    variables: {
      projectId: slug,
      pageInput: {
        url: faker.internet.url(),
        name: faker.word.noun(),
        profileIds: [profile.iid],
        envIds: [env.iid],
        competitorIds: [],
      },
    },
  })

  const page = await Page.findOneByOrFail({ projectId: 1, iid: response.createPage.id })
  const pageWithEnv = await PageWithEnv.findBy({ pageId: page.id })
  const pageWithProfile = await PageWithProfile.findBy({ pageId: page.id })

  t.truthy(page)
  t.is(response.createPage.id, page!.iid)
  t.is(response.createPage.url, page!.url)
  t.is(pageWithEnv.length, 1)
  t.is(pageWithProfile.length, 1)
})

test.serial('update page', async (t) => {
  const page = await Page.findOneByOrFail({ projectId: 1 })
  const profile = await Profile.findOneByOrFail({ projectId: 1 })

  const response = await gqlClient.query({
    query: updatePageMutation,
    variables: {
      projectId: slug,
      pageInput: {
        id: page.iid,
        name: faker.word.noun(),
        profileIds: [profile.iid],
        envIds: [],
        competitorIds: [],
      },
    },
  })

  const pageWithEnv = await PageWithEnv.findBy({ pageId: page.id })
  const pageWithProfile = await PageWithProfile.findBy({ pageId: page.id })

  t.truthy(page)
  t.is(response.updatePage.id, page.iid)
  t.is(response.updatePage.url, page.url)
  t.not(response.updatePage.name, page.name)
  t.is(pageWithEnv.length, 0)
  t.is(pageWithProfile.length, 1)
})

test.serial('create page with no permission', async (t) => {
  await gqlClient.loginAs(user)

  await t.throwsAsync(
    async () => {
      await gqlClient.query({
        query: createPageMutation,
        variables: {
          projectId: slug,
          pageInput: {
            url: faker.internet.url(),
            name: faker.word.noun(),
            profileIds: [],
            envIds: [],
            competitorIds: [],
          },
        },
      })
    },
    { instanceOf: Error, message: `[User Error] Unauthorized user` },
  )
})

test.serial('update page with no permission', async (t) => {
  await gqlClient.loginAs(user)
  const page = await Page.findOneByOrFail({ projectId: 1 })

  await t.throwsAsync(
    async () => {
      await gqlClient.query({
        query: updatePageMutation,
        variables: {
          projectId: slug,
          pageInput: {
            id: page.iid,
            name: faker.word.noun(),
            profileIds: [],
            envIds: [],
            competitorIds: [],
          },
        },
      })
    },
    { instanceOf: Error, message: `[User Error] Unauthorized user` },
  )
})

test.serial('delete page with no permission', async (t) => {
  await gqlClient.loginAs(user)
  const page = await Page.findOneByOrFail({ projectId: 1 })

  await t.throwsAsync(
    async () => {
      await gqlClient.query({
        query: deletePageMutation,
        variables: {
          projectId: slug,
          id: page.iid,
        },
      })
    },
    { instanceOf: Error, message: `[User Error] Unauthorized user` },
  )
})
