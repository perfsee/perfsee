import { Project, User } from '@perfsee/platform-server/db'
import test, { createDBTestingModule, createMock, initTestDB } from '@perfsee/platform-server/test'
import { GitHost, Permission } from '@perfsee/shared'

import { SelfHostPermissionProvider } from '../providers/self-host'

const users = [
  {
    id: 1,
    username: 'test1',
    email: 'test1@test.com',
  },
  {
    id: 2,
    username: 'test2',
    email: 'test2@test.com',
  },
] as User[]

const project = {
  id: 1,
  namespace: 'test',
  name: 'project',
  host: GitHost.Gitlab,
  artifactBaselineBranch: 'master',
  createdAt: new Date(),
  slug: '1',
} as any as Project

const project2 = {
  id: 2,
  namespace: 'test',
  name: 'project-2',
  host: GitHost.Gitlab,
  artifactBaselineBranch: 'master',
  createdAt: new Date(),
  slug: '2',
} as any as Project

const project3 = {
  id: 3,
  slug: '3',
  namespace: 'test',
  name: 'project-2',
  host: GitHost.Gitlab,
  artifactBaselineBranch: 'master',
  createdAt: new Date(),
  isPublic: true,
}

test.beforeEach(async (t) => {
  t.context.module = await createDBTestingModule({
    providers: [SelfHostPermissionProvider],
  })
    .useMocker(createMock)
    .compile()

  const conn = await initTestDB()

  await conn.transaction(async (manager) => {
    await manager.save(User, users)
    await manager.save(Project, [project, project2, project3])
  })
})

test.serial('grant admin for project owners', async (t) => {
  const permission = t.context.module.get(SelfHostPermissionProvider)
  await permission.onCreateProject(project, users, users[0])

  t.true(await permission.check(users[0], project.slug, Permission.Admin))
  t.true(await permission.check(users[1], project.slug, Permission.Admin))
})

test.serial('grant permission manually', async (t) => {
  const permission = t.context.module.get(SelfHostPermissionProvider)
  t.false(await permission.check(users[0], project.slug, Permission.Admin))
  t.false(await permission.check(users[1], project.slug, Permission.Read))

  await permission.grant(users[0], project.id, Permission.Admin)
  t.true(await permission.check(users[0], project.slug, Permission.Admin))
  t.true(await permission.check(users[0], project.id, Permission.Read))

  await permission.grant(users[1], project.id, Permission.Read)
  t.true(await permission.check(users[1], project.slug, Permission.Read))
  t.false(await permission.check(users[1], project.slug, Permission.Admin))
})

test.serial('revoke users permission', async (t) => {
  const permission = t.context.module.get(SelfHostPermissionProvider)

  await permission.grant(users[0], project.id, Permission.Admin)
  await permission.revoke(users[0], project.id, Permission.Admin)

  t.false(await permission.check(users[0], project.slug, Permission.Admin))
  t.false(await permission.check(users[0], project.id, Permission.Read))
})

test.serial('get user permission', async (t) => {
  const permission = t.context.module.get(SelfHostPermissionProvider)

  const user = users[0]

  await permission.grant(user, project.id, Permission.Read)

  const permissions = await permission.get(user, project.id)
  t.deepEqual(permissions, [Permission.Read])

  await permission.grant(user, project.id, Permission.Admin)

  const permissions2 = await permission.get(user, project.id)
  t.deepEqual(permissions2, [Permission.Read, Permission.Admin])
})

test.serial('user allow list', async (t) => {
  const permission = t.context.module.get(SelfHostPermissionProvider)

  await permission.grant(users[0], project.id, Permission.Read)
  await permission.grant(users[0], project2.id, Permission.Admin)

  t.deepEqual(await permission.userAllowList(users[0], Permission.Read), [project.id, project2.id])
  t.deepEqual(await permission.userAllowList(users[0], Permission.Admin), [project2.id])
})

test.serial('project allow list', async (t) => {
  const permission = t.context.module.get(SelfHostPermissionProvider)

  await permission.grant(users[0], project.id, Permission.Read)
  await permission.grant(users[1], project.id, Permission.Admin)

  t.deepEqual(await permission.projectAllowList(project, Permission.Read), [users[0].id, users[1].id])
  t.deepEqual(await permission.projectAllowList(project, Permission.Admin), [users[1].id])
})

test.serial('pass read request if project is public', async (t) => {
  const permission = t.context.module.get(SelfHostPermissionProvider)

  t.true(await permission.check(users[0], project3.slug, Permission.Read))
  t.false(await permission.check(users[0], project3.slug, Permission.Admin))
})
