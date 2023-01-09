import { faker } from '@faker-js/faker'
import { chunk, sample } from 'lodash'

import { Environment, Profile, Organization, Setting, User } from '@perfsee/platform-server/db'
import test, { create, GraphQLTestingClient, initTestDB } from '@perfsee/platform-server/test'
import {
  createOrganizationMutation,
  GitHost,
  organizationQuery,
  organizationsQuery,
  toggleStarOrganizationMutation,
  updateOrganizationMutation,
  vscodeGetOrganizationsByNamespaceAndNameQuery,
  addOrganizationOwnerMutation,
  updateOrganizationUserPermissionMutation,
  Permission,
  organizationAuthedUsersQuery,
} from '@perfsee/schema'

let gqlClient: GraphQLTestingClient
let organization: Organization
let user: User

test.before(async () => {
  await initTestDB()
  gqlClient = new GraphQLTestingClient()

  user = await create(User, {
    isAdmin: true,
  })
  await gqlClient.loginAs(user)

  organization = await create(Organization)
})

test('create organization', async (t) => {
  const input = {
    id: faker.internet.domainWord(),
    host: GitHost.Github,
    namespace: faker.internet.domainWord(),
    name: faker.internet.userName(),
    artifactBaselineBranch: 'main',
  }

  const createResponse = await gqlClient.mutate({
    mutation: createOrganizationMutation,
    variables: {
      input,
    },
  })

  const response = await gqlClient.query({
    query: organizationQuery,
    variables: {
      organizationId: input.id,
    },
  })

  t.truthy(createResponse.createOrganization)
  t.truthy(response.organization)
  t.is(createResponse.createOrganization.id, response.organization.id)
  t.is(response.organization.artifactBaselineBranch, input.artifactBaselineBranch)

  // clear
  const dbOrganization = await Organization.findOneByOrFail({ slug: createResponse.createOrganization.id })
  await Profile.delete({ organizationId: dbOrganization.id })
  await Environment.delete({ organizationId: dbOrganization.id })
  await Setting.delete({ organizationId: dbOrganization.id })
  await Organization.delete({ id: dbOrganization.id })
  t.pass()
})

test('get organization', async (t) => {
  const response = await gqlClient.query({
    query: organizationQuery,
    variables: {
      organizationId: organization.slug,
    },
  })

  const gqlOrganization = response.organization

  t.truthy(gqlOrganization)
  t.is(gqlOrganization.name, organization.name)
})

test('unable to get organization by no read permission user', async (t) => {
  const user = await create(User)
  const client = new GraphQLTestingClient()
  await client.loginAs(user)

  await t.throwsAsync(
    async () => {
      await client.query({
        query: organizationQuery,
        variables: {
          organizationId: organization.slug,
        },
      })
    },
    { message: '[User Error] Unauthorized user' },
  )
})

test('get organization by name', async (t) => {
  const response = await gqlClient.query({
    query: organizationQuery,
    variables: {
      organizationId: organization.slug,
    },
  })

  t.is(response.organization.id, organization.slug)
})

test('get organizations', async (t) => {
  const normalUser = await create(User)
  const normalGqlClient = new GraphQLTestingClient()
  await normalGqlClient.loginAs(normalUser)

  const pagination = {
    first: 10,
    skip: 0,
  }

  // not visible
  const response = await normalGqlClient.query({
    query: organizationsQuery,
    variables: {
      input: pagination,
      starred: false,
    },
  })

  t.is(response.organizations.edges.length, 0)

  // add normalUser to organization owner
  const addOwnerResponse = await gqlClient.mutate({
    mutation: addOrganizationOwnerMutation,
    variables: {
      email: normalUser.email,
      organizationId: organization.slug,
    },
  })

  t.truthy(addOwnerResponse)

  // with permission
  const responseWithPermission = await normalGqlClient.query({
    query: organizationsQuery,
    variables: {
      input: pagination,
      starred: false,
    },
  })

  t.is(responseWithPermission.organizations.edges.length, 1)
  t.is(responseWithPermission.organizations.edges[0].node.id, organization.slug)

  // search
  const chunks = chunk(organization.name, 3)
  const queryChars = sample(chunks) ?? chunks[0]

  const searchResponse = await normalGqlClient.query({
    query: organizationsQuery,
    variables: {
      input: pagination,
      starred: false,
      query: queryChars.join(''),
    },
  })

  t.is(searchResponse.organizations.edges.length, 1)
  t.is(searchResponse.organizations.edges[0].node.id, organization.slug)
})

test('unable to add owner by no admin permission user', async (t) => {
  const user = await create(User)
  const client = new GraphQLTestingClient()

  await client.loginAs(user)

  await t.throwsAsync(
    async () => {
      await client.mutate({
        mutation: addOrganizationOwnerMutation,
        variables: {
          email: user.email,
          organizationId: organization.slug,
        },
      })
    },
    { message: '[User Error] Unauthorized user' },
  )
})

test('get organizations by namespace and name', async (t) => {
  const response = await gqlClient.query({
    query: vscodeGetOrganizationsByNamespaceAndNameQuery,
    variables: {
      host: organization.host,
      namespace: organization.namespace,
      name: organization.name,
    },
  })

  t.is(response.organizationsByRepo[0].id, organization.slug)
})

test('update organization', async (t) => {
  const newBranch = faker.git.branch()
  await gqlClient.mutate({
    mutation: updateOrganizationMutation,
    variables: {
      organizationId: organization.slug,
      organizationInput: {
        artifactBaselineBranch: newBranch,
        isPublic: true,
      },
    },
  })

  const response = await gqlClient.query({
    query: organizationQuery,
    variables: {
      organizationId: organization.slug,
    },
  })

  t.is(response.organization.artifactBaselineBranch, newBranch)
  t.is(response.organization.isPublic, true)
})

test('unable to update organization by no admin permission user', async (t) => {
  const user = await create(User)
  const client = new GraphQLTestingClient()

  await client.loginAs(user)

  await t.throwsAsync(
    async () => {
      await client.mutate({
        mutation: updateOrganizationMutation,
        variables: {
          organizationId: organization.slug,
          organizationInput: {
            artifactBaselineBranch: faker.git.branch(),
          },
        },
      })
    },
    { message: '[User Error] Unauthorized user' },
  )
})

test.serial('toggle star organization', async (t) => {
  // star organization
  const response = await gqlClient.mutate({
    mutation: toggleStarOrganizationMutation,
    variables: {
      organizationId: organization.slug,
      star: true,
    },
  })

  t.truthy(response.toggleStarOrganization)

  // starred but not in visible list
  const starredOrganizationsResponse = await gqlClient.query({
    query: organizationsQuery,
    variables: {
      input: { first: 10, skip: 0 },
      starred: true,
    },
  })

  t.is(starredOrganizationsResponse.organizations.edges.length, 0)

  // add to owner
  const addOwnerResponse = await gqlClient.mutate({
    mutation: addOrganizationOwnerMutation,
    variables: {
      email: user.email,
      organizationId: organization.slug,
    },
  })

  t.truthy(addOwnerResponse.addOrganizationOwner)

  // with permission and starred
  const starredOrganizationsWithPermissionResponse = await gqlClient.query({
    query: organizationsQuery,
    variables: {
      input: { first: 10, skip: 0 },
      starred: true,
    },
  })

  t.is(starredOrganizationsWithPermissionResponse.organizations.edges.length, 1)
  t.is(starredOrganizationsWithPermissionResponse.organizations.edges[0].node.id, organization.slug)

  // cancel star organization
  const unstarResponse = await gqlClient.mutate({
    mutation: toggleStarOrganizationMutation,
    variables: {
      organizationId: organization.slug,
      star: false,
    },
  })

  t.truthy(unstarResponse.toggleStarOrganization)

  // user get starred organizations, get none
  const noStarredOrganizationsResponse = await gqlClient.query({
    query: organizationsQuery,
    variables: {
      input: { first: 10, skip: 0 },
      starred: true,
    },
  })

  t.is(noStarredOrganizationsResponse.organizations.edges.length, 0)
})

test('unable to star no read permission organization', async (t) => {
  const user = await create(User)
  const client = new GraphQLTestingClient()

  await client.loginAs(user)

  // set organization to private
  await gqlClient.mutate({
    mutation: updateOrganizationMutation,
    variables: {
      organizationId: organization.slug,
      organizationInput: {
        isPublic: false,
      },
    },
  })

  await t.throwsAsync(
    async () => {
      await client.mutate({
        mutation: toggleStarOrganizationMutation,
        variables: {
          organizationId: organization.slug,
          star: true,
        },
      })
    },
    { message: '[User Error] Unauthorized user' },
  )
})

test.serial('update organization user permissions', async (t) => {
  const user = await create(User)

  await gqlClient.mutate({
    mutation: updateOrganizationUserPermissionMutation,
    variables: {
      organizationId: organization.slug,
      email: user.email,
      permission: Permission.Admin,
      isAdd: true,
    },
  })

  const response = await gqlClient.query({
    query: organizationAuthedUsersQuery,
    variables: {
      organizationId: organization.slug,
    },
  })

  const user1 = response.organization.authorizedUsers.find((u) => u.email === user.email)
  t.is(user1?.permission, Permission.Admin)

  await t.throwsAsync(
    async () => {
      await gqlClient.mutate({
        mutation: updateOrganizationUserPermissionMutation,
        variables: {
          organizationId: organization.slug,
          email: user.email,
          permission: Permission.Read,
          isAdd: true,
        },
      })
    },
    { message: '[User Error] User already has this permission' },
  )

  await gqlClient.mutate({
    mutation: updateOrganizationUserPermissionMutation,
    variables: {
      organizationId: organization.slug,
      email: user.email,
      permission: Permission.Admin,
      isAdd: false,
    },
  })

  const response2 = await gqlClient.query({
    query: organizationAuthedUsersQuery,
    variables: {
      organizationId: organization.slug,
    },
  })

  t.falsy(response2.organization.authorizedUsers.find((u) => u.email === user.email))

  await t.throwsAsync(
    async () => {
      await gqlClient.mutate({
        mutation: updateOrganizationUserPermissionMutation,
        variables: {
          organizationId: organization.slug,
          email: user.email,
          permission: Permission.Admin,
          isAdd: false,
        },
      })
    },
    { message: '[User Error] User do not has this permission' },
  )

  await t.throwsAsync(
    async () => {
      await gqlClient.mutate({
        mutation: updateOrganizationUserPermissionMutation,
        variables: {
          organizationId: organization.slug,
          email: faker.internet.email(),
          permission: Permission.Read,
          isAdd: true,
        },
      })
    },
    { message: '[User Error] No such user' },
  )
})
