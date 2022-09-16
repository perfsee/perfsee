import { faker } from '@faker-js/faker'
import { chunk, sample } from 'lodash'

import { Environment, Profile, Project, Setting, User } from '@perfsee/platform-server/db'
import test, { create, GraphQLTestingClient, initTestDB } from '@perfsee/platform-server/test'
import {
  createProjectMutation,
  GitHost,
  projectQuery,
  projectsQuery,
  toggleStarProjectMutation,
  updateProjectMutation,
  vscodeGetProjectsByNamespaceAndNameQuery,
  addProjectOwnerMutation,
} from '@perfsee/schema'

let gqlClient: GraphQLTestingClient
let project: Project
let user: User

test.before(async () => {
  await initTestDB()
  gqlClient = new GraphQLTestingClient()

  user = await create(User, {
    isAdmin: true,
  })
  await gqlClient.loginAs(user)

  project = await create(Project)
})

test('create project', async (t) => {
  const input = {
    id: faker.internet.domainWord(),
    host: GitHost.Github,
    namespace: faker.internet.domainWord(),
    name: faker.internet.userName(),
    artifactBaselineBranch: 'main',
  }

  const createResponse = await gqlClient.mutate({
    mutation: createProjectMutation,
    variables: {
      input,
    },
  })

  const response = await gqlClient.query({
    query: projectQuery,
    variables: {
      projectId: input.id,
    },
  })

  t.truthy(createResponse.createProject)
  t.truthy(response.project)
  t.is(createResponse.createProject.id, response.project.id)
  t.is(response.project.artifactBaselineBranch, input.artifactBaselineBranch)

  // clear
  const dbProject = await Project.findOneByOrFail({ slug: createResponse.createProject.id })
  await Profile.delete({ projectId: dbProject.id })
  await Environment.delete({ projectId: dbProject.id })
  await Setting.delete({ projectId: dbProject.id })
  await Project.delete({ id: dbProject.id })
  t.pass()
})

test('get project', async (t) => {
  const response = await gqlClient.query({
    query: projectQuery,
    variables: {
      projectId: project.slug,
    },
  })

  const gqlProject = response.project

  t.truthy(gqlProject)
  t.is(gqlProject.name, project.name)
})

test('unable to get project by no read permission user', async (t) => {
  const user = await create(User)
  const client = new GraphQLTestingClient()
  await client.loginAs(user)

  await t.throwsAsync(
    async () => {
      await client.query({
        query: projectQuery,
        variables: {
          projectId: project.slug,
        },
      })
    },
    { message: '[User Error] Unauthorized user' },
  )
})

test('get project by name', async (t) => {
  const response = await gqlClient.query({
    query: projectQuery,
    variables: {
      projectId: project.slug,
    },
  })

  t.is(response.project.id, project.slug)
})

test('get projects', async (t) => {
  const normalUser = await create(User)
  const normalGqlClient = new GraphQLTestingClient()
  await normalGqlClient.loginAs(normalUser)

  const pagination = {
    first: 10,
    skip: 0,
  }

  // not visible
  const response = await normalGqlClient.query({
    query: projectsQuery,
    variables: {
      input: pagination,
      starred: false,
    },
  })

  t.is(response.projects.edges.length, 0)

  // add normalUser to project owner
  const addOwnerResponse = await gqlClient.mutate({
    mutation: addProjectOwnerMutation,
    variables: {
      email: normalUser.email,
      projectId: project.slug,
    },
  })

  t.truthy(addOwnerResponse)

  // with permission
  const responseWithPermission = await normalGqlClient.query({
    query: projectsQuery,
    variables: {
      input: pagination,
      starred: false,
    },
  })

  t.is(responseWithPermission.projects.edges.length, 1)
  t.is(responseWithPermission.projects.edges[0].node.id, project.slug)

  // search
  const chunks = chunk(project.name, 3)
  const queryChars = sample(chunks) ?? chunks[0]

  const searchResponse = await normalGqlClient.query({
    query: projectsQuery,
    variables: {
      input: pagination,
      starred: false,
      query: queryChars.join(''),
    },
  })

  t.is(searchResponse.projects.edges.length, 1)
  t.is(searchResponse.projects.edges[0].node.id, project.slug)
})

test('unable to add owner by no admin permission user', async (t) => {
  const user = await create(User)
  const client = new GraphQLTestingClient()

  await client.loginAs(user)

  await t.throwsAsync(
    async () => {
      await client.mutate({
        mutation: addProjectOwnerMutation,
        variables: {
          email: user.email,
          projectId: project.slug,
        },
      })
    },
    { message: '[User Error] Unauthorized user' },
  )
})

test('get projects by namespace and name', async (t) => {
  const response = await gqlClient.query({
    query: vscodeGetProjectsByNamespaceAndNameQuery,
    variables: {
      host: project.host,
      namespace: project.namespace,
      name: project.name,
    },
  })

  t.is(response.projectsByRepo[0].id, project.slug)
})

test('update project', async (t) => {
  const newBranch = faker.git.branch()
  const newUser = await create(User)
  await gqlClient.mutate({
    mutation: updateProjectMutation,
    variables: {
      projectId: project.slug,
      projectInput: {
        artifactBaselineBranch: newBranch,
        owners: [user.email, newUser.email],
        isPublic: true,
      },
    },
  })

  const response = await gqlClient.query({
    query: projectQuery,
    variables: {
      projectId: project.slug,
    },
  })

  t.is(response.project.artifactBaselineBranch, newBranch)
  t.deepEqual(
    response.project.owners.map((o) => o.email),
    [user.email, newUser.email],
  )
  t.is(response.project.isPublic, true)
})

test('unable to update project by no admin permission user', async (t) => {
  const user = await create(User)
  const client = new GraphQLTestingClient()

  await client.loginAs(user)

  await t.throwsAsync(
    async () => {
      await client.mutate({
        mutation: updateProjectMutation,
        variables: {
          projectId: project.slug,
          projectInput: {
            artifactBaselineBranch: faker.git.branch(),
          },
        },
      })
    },
    { message: '[User Error] Unauthorized user' },
  )
})

test.serial('toggle star project', async (t) => {
  // star project
  const response = await gqlClient.mutate({
    mutation: toggleStarProjectMutation,
    variables: {
      projectId: project.slug,
      star: true,
    },
  })

  t.truthy(response.toggleStarProject)

  // starred but not in visible list
  const starredProjectsResponse = await gqlClient.query({
    query: projectsQuery,
    variables: {
      input: { first: 10, skip: 0 },
      starred: true,
    },
  })

  t.is(starredProjectsResponse.projects.edges.length, 0)

  // add to owner
  const addOwnerResponse = await gqlClient.mutate({
    mutation: addProjectOwnerMutation,
    variables: {
      email: user.email,
      projectId: project.slug,
    },
  })

  t.truthy(addOwnerResponse.addProjectOwner)

  // with permission and starred
  const starredProjectsWithPermissionResponse = await gqlClient.query({
    query: projectsQuery,
    variables: {
      input: { first: 10, skip: 0 },
      starred: true,
    },
  })

  t.is(starredProjectsWithPermissionResponse.projects.edges.length, 1)
  t.is(starredProjectsWithPermissionResponse.projects.edges[0].node.id, project.slug)

  // cancel star project
  const unstarResponse = await gqlClient.mutate({
    mutation: toggleStarProjectMutation,
    variables: {
      projectId: project.slug,
      star: false,
    },
  })

  t.truthy(unstarResponse.toggleStarProject)

  // user get starred projects, get none
  const noStarredProjectsResponse = await gqlClient.query({
    query: projectsQuery,
    variables: {
      input: { first: 10, skip: 0 },
      starred: true,
    },
  })

  t.is(noStarredProjectsResponse.projects.edges.length, 0)
})

test('unable to star no read permission project', async (t) => {
  const user = await create(User)
  const client = new GraphQLTestingClient()

  await client.loginAs(user)

  // set project to private
  await gqlClient.mutate({
    mutation: updateProjectMutation,
    variables: {
      projectId: project.slug,
      projectInput: {
        isPublic: false,
      },
    },
  })

  await t.throwsAsync(
    async () => {
      await client.mutate({
        mutation: toggleStarProjectMutation,
        variables: {
          projectId: project.slug,
          star: true,
        },
      })
    },
    { message: '[User Error] Unauthorized user' },
  )
})
