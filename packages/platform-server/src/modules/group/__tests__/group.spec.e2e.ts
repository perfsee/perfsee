import { faker } from '@faker-js/faker'
import { chunk, sample } from 'lodash'

import { Group, Project, ProjectGroup, User } from '@perfsee/platform-server/db'
import test, { create, GraphQLTestingClient, initTestDB } from '@perfsee/platform-server/test'
import {
  createGroupMutation,
  groupQuery,
  groupsQuery,
  Permission,
  updateGroupMutation,
  updateGroupUserPermissionMutation,
} from '@perfsee/schema'

let gqlClient: GraphQLTestingClient
let group: Group
let user: User
let project: Project

test.before(async () => {
  await initTestDB()
  gqlClient = new GraphQLTestingClient()

  user = await create(User, {
    isAdmin: true,
  })
  await gqlClient.loginAs(user)

  group = await create(Group, { slug: faker.word.noun() })
  project = await create(Project, { slug: faker.word.noun() })
})

test('create group', async (t) => {
  const input = {
    id: faker.internet.domainWord(),
    projectIds: [project.slug],
  }

  const createResponse = await gqlClient.mutate({
    mutation: createGroupMutation,
    variables: {
      input,
    },
  })

  const response = await gqlClient.query({
    query: groupQuery,
    variables: {
      groupId: input.id,
    },
  })

  t.truthy(createResponse.createGroup)
  t.truthy(response.group)
  t.is(createResponse.createGroup.id, response.group.id)

  // clear
  const dbGroup = await Group.findOneByOrFail({ slug: createResponse.createGroup.id })
  await Group.delete({ id: dbGroup.id })
  await ProjectGroup.delete({ groupId: dbGroup.id })
  t.pass()
})

test('get group', async (t) => {
  const response = await gqlClient.query({
    query: groupQuery,
    variables: {
      groupId: group.slug,
    },
  })

  const gqlGroup = response.group

  t.truthy(gqlGroup)
  t.is(gqlGroup.id, group.slug)
})

test('add project to group', async (t) => {
  const project2 = await create(Project, { slug: faker.word.noun() })

  const updateResponse = await gqlClient.mutate({
    mutation: updateGroupMutation,
    variables: {
      groupId: group.slug,
      projectId: project2.slug,
      isAdd: true,
    },
  })

  const response = await gqlClient.query({
    query: groupQuery,
    variables: {
      groupId: group.slug,
    },
  })

  t.truthy(updateResponse.updateGroupProject)
  t.is(updateResponse.updateGroupProject.id, project2.slug)
  t.is(response.group.projects.length, 1)
})

test('delete project from group', async (t) => {
  const project2 = await create(Project, { slug: faker.word.noun() })
  await create(ProjectGroup, { groupId: group.id, project: project2 })

  const updateResponse = await gqlClient.mutate({
    mutation: updateGroupMutation,
    variables: {
      groupId: group.slug,
      projectId: project2.slug,
      isAdd: false,
    },
  })

  const response = await gqlClient.query({
    query: groupQuery,
    variables: {
      groupId: group.slug,
    },
  })

  t.truthy(updateResponse.updateGroupProject)
  t.is(updateResponse.updateGroupProject.id, project2.slug)
  t.is(response.group.projects.length, 1)
})

test('unable to get group by no read permission user', async (t) => {
  const user = await create(User)
  const client = new GraphQLTestingClient()
  await client.loginAs(user)

  await t.throwsAsync(
    async () => {
      await client.query({
        query: groupQuery,
        variables: {
          groupId: group.slug,
        },
      })
    },
    { message: '[User Error] Unauthorized user' },
  )
})

test('get groups', async (t) => {
  const normalUser = await create(User)
  const normalGqlClient = new GraphQLTestingClient()
  await normalGqlClient.loginAs(normalUser)

  const pagination = {
    first: 10,
    skip: 0,
  }

  // not visible
  const response = await normalGqlClient.query({
    query: groupsQuery,
    variables: {
      input: pagination,
    },
  })

  t.is(response.groups.edges.length, 0)

  // add normalUser to group owner
  const addOwnerResponse = await gqlClient.mutate({
    mutation: updateGroupUserPermissionMutation,
    variables: {
      email: normalUser.email,
      groupId: group.slug,
      isAdd: true,
      permission: Permission.Read,
    },
  })

  t.truthy(addOwnerResponse)

  // with permission
  const responseWithPermission = await normalGqlClient.query({
    query: groupsQuery,
    variables: {
      input: pagination,
    },
  })

  t.is(responseWithPermission.groups.edges.length, 1)
  t.is(responseWithPermission.groups.edges[0].node.id, group.slug)

  // search
  const chunks = chunk(group.slug, 3)
  const queryChars = sample(chunks) ?? chunks[0]

  const searchResponse = await normalGqlClient.query({
    query: groupsQuery,
    variables: {
      input: pagination,
      query: queryChars.join(''),
    },
  })

  t.is(searchResponse.groups.edges.length, 1)
  t.is(searchResponse.groups.edges[0].node.id, group.slug)
})
