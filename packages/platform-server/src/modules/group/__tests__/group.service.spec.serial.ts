import { faker } from '@faker-js/faker'

import { Group, Project, ProjectGroup, User } from '@perfsee/platform-server/db'
import { Metric } from '@perfsee/platform-server/metrics'
import test, { createMock, initTestDB, createDBTestingModule, DeepMocked, create } from '@perfsee/platform-server/test'

import { PermissionProvider, Permission } from '../../permission'
import { UserService } from '../../user'
import { GroupService } from '../service'

let group: Group
let user: User
let project: Project

test.before(async (t) => {
  t.context.module = await createDBTestingModule({
    providers: [GroupService],
  })
    .useMocker(createMock)
    .compile()

  await initTestDB()

  user = await create(User)
  group = await create(Group, {
    slug: faker.word.noun(),
  })
  project = await create(Project, {
    slug: faker.word.noun(),
  })
})

test.serial('create group', async (t) => {
  const service = t.context.module.get(GroupService)
  const metricService = t.context.module.get(Metric)

  const groupCreated = await service.create(user, {
    id: faker.internet.domainWord(),
    projectIds: [project.slug],
  })

  const projectInGroup = await ProjectGroup.findBy({ groupId: groupCreated.id })

  t.is(projectInGroup.length, 1)
  t.is(projectInGroup[0].projectId, project.id)
  t.is(metricService.newGroup.getCall(0).args[0], 1)

  // clear
  await Group.delete({ id: groupCreated.id })
  await ProjectGroup.delete({ groupId: groupCreated.id })
})

test.serial('create existed group', async (t) => {
  const service = t.context.module.get(GroupService)

  await t.throwsAsync(
    async () => {
      await service.create(user, {
        id: group.slug,
        projectIds: [project.slug],
      })
    },
    { instanceOf: Error },
  )
})

test.serial('get group', async (t) => {
  const service = t.context.module.get(GroupService)

  const groupResult = await service.getGroup(group.slug)
  t.truthy(groupResult)

  const groupById = await service.getGroupById(group.id)
  t.truthy(groupById)
  t.is(group.slug, groupById!.slug)

  t.truthy(groupById)

  const groupId = await service.resolveRawGroupIdBySlug(group.slug)
  t.is(groupId, group.id)
})

test.serial('get groups', async (t) => {
  const service = t.context.module.get(GroupService)
  const permissionProvider: DeepMocked<PermissionProvider> = t.context.module.get(PermissionProvider)

  const pagination = { skip: 0, first: 10, after: null }

  // no permission user
  permissionProvider.userAllowList.resolves([])
  const [emptyGroups, emptyCount] = await service.getGroups(user, pagination)

  t.is(emptyGroups.length, 0)
  t.is(emptyCount, 0)

  // user with permission
  permissionProvider.userAllowList.resolves([group.id])
  const [groups, count] = await service.getGroups(user, pagination)

  t.is(groups.length, 1)
  t.is(count, 1)
})

test.serial('check permission', async (t) => {
  const service = t.context.module.get(GroupService)
  const permissionProvider: DeepMocked<PermissionProvider> = t.context.module.get(PermissionProvider)

  const body = {
    user,
    slug: group.slug,
    permission: Permission.Read,
  }

  // with permission
  permissionProvider.check.resolves(true)
  let accessible = await service.checkPermission(body)

  t.true(accessible)

  // no permission
  permissionProvider.check.resolves(false)
  accessible = await service.checkPermission(body)

  t.false(accessible)
})

test.serial('get permission', async (t) => {
  const service = t.context.module.get(GroupService)
  const permissionProvider: DeepMocked<PermissionProvider> = t.context.module.get(PermissionProvider)

  permissionProvider.get.resolves([Permission.Admin])

  const permissions = await service.getUserPermission(user, group)

  t.deepEqual(permissions, [Permission.Admin])
})

test.serial('group owners', async (t) => {
  const service = t.context.module.get(GroupService)
  const permissionProvider: DeepMocked<PermissionProvider> = t.context.module.get(PermissionProvider)

  // return userId
  permissionProvider.groupAllowList.resolves([user.id])
  const owners = await service.getGroupUsers(group, Permission.Admin)

  t.is(owners.length, 1)
  t.is(owners[0].username, user.username)

  // return user email
  permissionProvider.groupAllowList.resolves([user.email])
  const ownersWithEmail = await service.getGroupUsers(group, Permission.Admin)

  t.is(ownersWithEmail.length, 1)
  t.is(ownersWithEmail[0].username, user.username)
})

test.serial('group viewers', async (t) => {
  const service = t.context.module.get(GroupService)
  const permissionProvider: DeepMocked<PermissionProvider> = t.context.module.get(PermissionProvider)

  // return userId
  permissionProvider.groupAllowList.resolves([user.id])
  const viewers = await service.getGroupUsers(group, Permission.Read)

  t.is(viewers.length, 1)
  t.is(viewers[0].username, user.username)

  // return user email
  permissionProvider.groupAllowList.resolves([user.email])
  const viewersWithEmail = await service.getGroupUsers(group, Permission.Read)

  t.is(viewersWithEmail.length, 1)
  t.is(viewersWithEmail[0].username, user.username)
})

test.serial('update group user permission', async (t) => {
  const service = t.context.module.get(GroupService)
  const userService = t.context.module.get(UserService)
  const permissionProvider: DeepMocked<PermissionProvider> = t.context.module.get(PermissionProvider)

  // add permission
  await service.updateGroupUserPermission(group.id, user.email, Permission.Admin, true)
  t.truthy(permissionProvider.grant.calledOnce)

  // revoke permission
  permissionProvider.check.resolves(true)
  await service.updateGroupUserPermission(group.id, user.email, Permission.Admin, false)
  t.truthy(permissionProvider.revoke.calledOnce)

  // grant already existed permission
  permissionProvider.check.resolves(true)
  await t.throwsAsync(
    async () => {
      await service.updateGroupUserPermission(group.id, user.email, Permission.Admin, true)
    },
    { message: /User already has this permission/ },
  )

  // revoke not existed permission
  permissionProvider.check.resolves(false)
  await t.throwsAsync(
    async () => {
      await service.updateGroupUserPermission(group.id, user.email, Permission.Admin, false)
    },
    { message: /User do not has this permission/ },
  )

  // error user email
  userService.findUserByEmail.resolves(null)
  await t.throwsAsync(
    async () => {
      await service.updateGroupUserPermission(group.id, user.email, Permission.Admin, true)
    },
    { message: /No such user/ },
  )
})

test.serial('add project to group', async (t) => {
  const service = t.context.module.get(GroupService)
  const project2 = await create(Project, {
    slug: faker.word.noun(),
  })

  const project = await service.updateGroupProject(group.id, project2.slug, true)
  const projectInGroup = await ProjectGroup.findBy({ groupId: group.id })

  t.is(projectInGroup.length, 1)
  t.is(project.id, project2.id)
  t.is(projectInGroup[0].projectId, project2.id)
})

test.serial('delete project to group', async (t) => {
  const service = t.context.module.get(GroupService)
  const project2 = await create(Project, {
    slug: faker.word.noun(),
  })

  await create(ProjectGroup, {
    group,
    project: project2,
  })

  const project = await service.updateGroupProject(group.id, project2.slug, false)
  const projectInGroup = await ProjectGroup.findBy({ groupId: group.id })

  t.is(projectInGroup.length, 1)
  t.is(project.id, project2.id)
})

test.serial('delete group', async (t) => {
  const service = t.context.module.get(GroupService)

  const groupCreated = await service.create(user, {
    id: faker.internet.domainWord(),
    projectIds: [project.slug],
  })
  await service.deleteGroup(groupCreated.id)

  const group = await Group.findOneBy({ id: groupCreated.id })

  t.is(group, null)
})
