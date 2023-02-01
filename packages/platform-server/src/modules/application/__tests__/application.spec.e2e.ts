import { faker } from '@faker-js/faker'

import { AccessToken, Application, Project, User } from '@perfsee/platform-server/db'
import test, { create, GraphQLTestingClient, initTestDB } from '@perfsee/platform-server/test'
import {
  applicationQuery,
  authorizeApplicationMutation,
  createApplicationMutation,
  getApplicationsQuery,
  updateApplicationPermissionsMutation,
  Permission,
  revokeApplicationPermissionsMutation,
  authorizedProjectsQuery,
  authorizedApplicationsQuery,
  userQuery,
  projectQuery,
  updateProjectMutation,
} from '@perfsee/schema'

let gqlClient: GraphQLTestingClient
let applicationGqlClient: GraphQLTestingClient

let project: Project
let application: Application

test.before(async () => {
  gqlClient = new GraphQLTestingClient()
  applicationGqlClient = new GraphQLTestingClient()
  await initTestDB()

  application = await create(User, {
    isApp: true,
  })

  applicationGqlClient.loginAs(application)

  project = await Project.findOneByOrFail({ id: 1 })
})

test.serial('create application', async (t) => {
  const name = faker.internet.userName()

  const createResponse = await gqlClient.mutate({
    mutation: createApplicationMutation,
    variables: {
      name,
    },
  })

  // get application info
  const response = await gqlClient.query({
    query: applicationQuery,
    variables: {
      name: createResponse.createApplication.application.username,
    },
  })

  t.truthy(createResponse.createApplication.token)
  t.is(response.application.username, name)
  t.is(response.application.id, createResponse.createApplication.application.id)

  // use this application token to send gql requests
  const innerClient = new GraphQLTestingClient()
  innerClient.setAuthToken(createResponse.createApplication.token)

  const userResponse = await innerClient.query({
    query: userQuery,
  })

  t.is(userResponse.user!.username, name)

  // clear
  await AccessToken.delete({ userId: createResponse.createApplication.application.id })
  await User.delete({ id: createResponse.createApplication.application.id })
  t.pass()
})

test('should not create application for normal user', async (t) => {
  const normalUser = await create(User)
  const client = new GraphQLTestingClient()
  await client.loginAs(normalUser)

  await t.throwsAsync(
    async () => {
      await client.mutate({
        mutation: createApplicationMutation,
        variables: {
          name: faker.word.noun(),
        },
      })
    },
    { message: '[User Error] Unauthorized user' },
  )
})

test('get applications', async (t) => {
  const response = await gqlClient.query({
    query: getApplicationsQuery,
    variables: {
      pagination: {
        first: 10,
        skip: 0,
      },
    },
  })

  t.is(response.applications.pageInfo.totalCount, 1)
  t.is(response.applications.edges.length, 1)
  t.is(response.applications.edges[0].node.id, application.id)
})

test.serial('authorize application', async (t) => {
  // no permission
  await t.throwsAsync(
    async () => {
      await applicationGqlClient.query({
        query: projectQuery,
        variables: {
          projectId: project.slug,
        },
      })
    },
    { message: /Unauthorized user/ },
  )

  // authorize application
  const authorizeResponse = await gqlClient.mutate({
    mutation: authorizeApplicationMutation,
    variables: {
      projectId: project.slug,
      applicationId: application.id,
      permissions: [Permission.Read],
    },
  })
  t.truthy(authorizeResponse.authorizeApplication)

  // with permission
  const response = await applicationGqlClient.query({
    query: projectQuery,
    variables: {
      projectId: project.slug,
    },
  })

  t.is(response.project.name, project.name)
})

test('user who is not project owner could not authorize application', async (t) => {
  const user = await create(User)
  const client = new GraphQLTestingClient()
  await client.loginAs(user)

  await t.throwsAsync(
    async () => {
      await client.mutate({
        mutation: authorizeApplicationMutation,
        variables: {
          projectId: project.slug,
          applicationId: application.id,
          permissions: [Permission.Read],
        },
      })
    },
    { message: '[User Error] Unauthorized user' },
  )
})

test.serial('update permission', async (t) => {
  const newBaselineBranch = faker.git.branch()

  // no admin permission
  await t.throwsAsync(
    async () => {
      await applicationGqlClient.mutate({
        mutation: updateProjectMutation,
        variables: {
          projectId: project.slug,
          projectInput: {
            artifactBaselineBranch: newBaselineBranch,
          },
        },
      })
    },
    { message: /Unauthorized user/ },
  )

  // update application permission
  const updateResponse = await gqlClient.mutate({
    mutation: updateApplicationPermissionsMutation,
    variables: {
      projectId: project.slug,
      applicationId: application.id,
      permissions: [Permission.Read, Permission.Admin],
    },
  })

  t.is(updateResponse.updateApplicationPermissions.length, 2)
  t.truthy(updateResponse.updateApplicationPermissions.includes(Permission.Admin))
  t.truthy(updateResponse.updateApplicationPermissions.includes(Permission.Read))

  // have admin permission
  const response = await applicationGqlClient.mutate({
    mutation: updateProjectMutation,
    variables: {
      projectId: project.slug,
      projectInput: {
        artifactBaselineBranch: newBaselineBranch,
      },
    },
  })

  t.is(response.updateProject.artifactBaselineBranch, newBaselineBranch)
})

test('user who is not project owner could not update application authorization', async (t) => {
  const user = await create(User)
  const client = new GraphQLTestingClient()
  await client.loginAs(user)

  await t.throwsAsync(
    async () => {
      await client.mutate({
        mutation: updateApplicationPermissionsMutation,
        variables: {
          projectId: project.slug,
          applicationId: application.id,
          permissions: [Permission.Read, Permission.Admin],
        },
      })
    },
    { message: '[User Error] Unauthorized user' },
  )
})

test.serial('get application authorized projects', async (t) => {
  project = await Project.findOneByOrFail({ id: 1 })

  const response = await gqlClient.query({
    query: authorizedProjectsQuery,
    variables: {
      appId: application.id,
    },
  })

  t.is(response.application.authorizedProjects.length, 1)
  t.is(response.application.authorizedProjects[0].project.name, project.name)
  t.is(response.application.authorizedProjects[0].permissions.length, 2)
  t.truthy(response.application.authorizedProjects[0].permissions.includes(Permission.Admin))
  t.truthy(response.application.authorizedProjects[0].permissions.includes(Permission.Read))
})

test.serial('get project authorized applications', async (t) => {
  const response = await gqlClient.query({
    query: authorizedApplicationsQuery,
    variables: {
      projectId: project.slug,
    },
  })

  t.is(response.project.authorizedApplications.length, 1)
  t.is(response.project.authorizedApplications[0].app.id, application.id)
  t.truthy(response.project.authorizedApplications[0].permissions.includes(Permission.Admin))
  t.truthy(response.project.authorizedApplications[0].permissions.includes(Permission.Read))
})

test.serial('revoke application permission', async (t) => {
  const revokeResponse = await gqlClient.mutate({
    mutation: revokeApplicationPermissionsMutation,
    variables: {
      projectId: project.slug,
      applicationId: application.id,
    },
  })

  t.truthy(revokeResponse.revokeApplicationPermissions)

  await t.throwsAsync(
    async () => {
      await applicationGqlClient.query({
        query: projectQuery,
        variables: {
          projectId: project.slug,
        },
      })
    },
    { message: /Unauthorized user/ },
  )
})

test('user who is not project owner could not revoke application authorization', async (t) => {
  const user = await create(User)
  const client = new GraphQLTestingClient()
  await client.loginAs(user)

  await t.throwsAsync(
    async () => {
      await client.mutate({
        mutation: revokeApplicationPermissionsMutation,
        variables: {
          projectId: project.slug,
          applicationId: application.id,
        },
      })
    },
    { message: '[User Error] Unauthorized user' },
  )
})
