import { faker } from '@faker-js/faker'

import { Project, User, Profile, Environment, Setting } from '@perfsee/platform-server/db'
import { InternalIdService } from '@perfsee/platform-server/helpers'
import { Metric } from '@perfsee/platform-server/metrics'
import test, { createMock, initTestDB, createDBTestingModule, DeepMocked, create } from '@perfsee/platform-server/test'
import { GitHost } from '@perfsee/shared'

import { PermissionProvider, Permission } from '../../permission'
import { UserService } from '../../user'
import { ProjectService } from '../service'

let project: Project
let user: User

test.before(async (t) => {
  t.context.module = await createDBTestingModule({
    providers: [ProjectService],
  })
    .useMocker(createMock)
    .compile()

  await initTestDB()

  user = await create(User)
  project = await create(Project)
})

test.serial('create project', async (t) => {
  const service = t.context.module.get(ProjectService)
  const internalIdService = t.context.module.get(InternalIdService)
  const metricService = t.context.module.get(Metric)

  internalIdService.generate.resolves(1)

  const projectCreated = await service.create(user, {
    id: faker.internet.domainWord(),
    host: GitHost.Github,
    namespace: faker.internet.domainWord(),
    name: faker.internet.userName(),
    artifactBaselineBranch: 'master',
  })

  // 1 for profile & 1 for environment
  t.is(internalIdService.generate.callCount, 2)

  const profiles = await Profile.findBy({ projectId: projectCreated.id })
  t.is(profiles.length, 1)

  const envs = await Environment.findBy({ projectId: projectCreated.id })
  t.is(envs.length, 1)

  const settings = await Setting.findBy({ projectId: projectCreated.id })
  t.is(settings.length, 1)

  t.is(metricService.newProject.getCall(0).args[0], 1)

  // clear
  await Profile.delete({ projectId: projectCreated.id })
  await Environment.delete({ projectId: projectCreated.id })
  await Setting.delete({ projectId: projectCreated.id })
  await Project.delete({ id: projectCreated.id })
})

test.serial('create existed project', async (t) => {
  const service = t.context.module.get(ProjectService)

  await t.throwsAsync(
    async () => {
      await service.create(user, {
        id: project.slug,
        host: GitHost.Github,
        name: faker.internet.domainWord(),
        namespace: faker.internet.userName(),
        artifactBaselineBranch: 'master',
      })
    },
    { instanceOf: Error },
  )
})

test.serial('get project', async (t) => {
  const service = t.context.module.get(ProjectService)

  const projectResult = await service.getProject(project.slug)
  t.truthy(projectResult)

  const projectById = await service.getProjectById(project.id)
  t.truthy(projectById)
  t.is(project.slug, projectById!.slug)

  const projectsByRepo = await service.getProjectsByRepo(project.host, project.namespace, project.name)
  t.truthy(projectById)
  t.is(projectsByRepo.length, 1)
  t.is(project.slug, projectsByRepo[0].slug)

  const projectId = await service.resolveRawProjectIdBySlug(project.slug)
  t.is(projectId, project.id)
})

test.serial('get projects', async (t) => {
  const service = t.context.module.get(ProjectService)
  const permissionProvider: DeepMocked<PermissionProvider> = t.context.module.get(PermissionProvider)

  const pagination = { skip: 0, first: 10, after: null }

  // no permission user
  permissionProvider.userAllowList.resolves([])
  const [emptyProjects, emptyCount] = await service.getProjects(user, pagination)

  t.is(emptyProjects.length, 0)
  t.is(emptyCount, 0)

  // user with permission
  permissionProvider.userAllowList.resolves([project.id])
  const [projects, count] = await service.getProjects(user, pagination)

  t.is(projects.length, 1)
  t.is(count, 1)

  // user not star any project
  const [, count2] = await service.getProjects(user, pagination, '', true)

  t.is(count2, 0)

  // star a project
  await service.toggleStarProject(user.id, project.slug, true)
  const [[starredProject], count3] = await service.getProjects(user, pagination, '', true)

  t.is(starredProject.id, project.id)
  t.is(count3, 1)

  // cancel star a project
  await service.toggleStarProject(user.id, project.slug, false)
  const [, count4] = await service.getProjects(user, pagination, '', true)

  t.is(count4, 0)
})

test.serial('update project', async (t) => {
  const service = t.context.module.get(ProjectService)

  // update project info
  await service.update(project.id, { artifactBaselineBranch: 'test' })
  project = await Project.findOneByOrFail({ id: project.id })

  t.is(project!.artifactBaselineBranch, 'test')
})

test.serial('check permission', async (t) => {
  const service = t.context.module.get(ProjectService)
  const permissionProvider: DeepMocked<PermissionProvider> = t.context.module.get(PermissionProvider)

  const body = {
    user,
    slug: project.slug,
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
  const service = t.context.module.get(ProjectService)
  const permissionProvider: DeepMocked<PermissionProvider> = t.context.module.get(PermissionProvider)

  permissionProvider.get.resolves([Permission.Admin])

  const permissions = await service.getUserPermission(user, project)

  t.deepEqual(permissions, [Permission.Admin])
})

test.serial('project owners', async (t) => {
  const service = t.context.module.get(ProjectService)
  const permissionProvider: DeepMocked<PermissionProvider> = t.context.module.get(PermissionProvider)

  // return userId
  permissionProvider.projectAllowList.resolves([user.id])
  const owners = await service.getProjectUsers(project, Permission.Admin)

  t.is(owners.length, 1)
  t.is(owners[0].username, user.username)

  // return user email
  permissionProvider.projectAllowList.resolves([user.email])
  const ownersWithEmail = await service.getProjectUsers(project, Permission.Admin)

  t.is(ownersWithEmail.length, 1)
  t.is(ownersWithEmail[0].username, user.username)
})

test.serial('project viewers', async (t) => {
  const service = t.context.module.get(ProjectService)
  const permissionProvider: DeepMocked<PermissionProvider> = t.context.module.get(PermissionProvider)

  // return userId
  permissionProvider.projectAllowList.resolves([user.id])
  const viewers = await service.getProjectUsers(project, Permission.Read)

  t.is(viewers.length, 1)
  t.is(viewers[0].username, user.username)

  // return user email
  permissionProvider.projectAllowList.resolves([user.email])
  const viewersWithEmail = await service.getProjectUsers(project, Permission.Read)

  t.is(viewersWithEmail.length, 1)
  t.is(viewersWithEmail[0].username, user.username)
})

test.serial('update project user permission', async (t) => {
  const service = t.context.module.get(ProjectService)
  const userService = t.context.module.get(UserService)
  const permissionProvider: DeepMocked<PermissionProvider> = t.context.module.get(PermissionProvider)

  // add permission
  await service.updateProjectUserPermission(project.id, user.email, Permission.Admin, true)
  t.truthy(permissionProvider.grant.calledOnce)

  // revoke permission
  permissionProvider.check.resolves(true)
  await service.updateProjectUserPermission(project.id, user.email, Permission.Admin, false)
  t.truthy(permissionProvider.revoke.calledOnce)

  // grant already existed permission
  permissionProvider.check.resolves(true)
  await t.throwsAsync(
    async () => {
      await service.updateProjectUserPermission(project.id, user.email, Permission.Admin, true)
    },
    { message: /User already has this permission/ },
  )

  // revoke not existed permission
  permissionProvider.check.resolves(false)
  await t.throwsAsync(
    async () => {
      await service.updateProjectUserPermission(project.id, user.email, Permission.Admin, false)
    },
    { message: /User do not has this permission/ },
  )

  // error user email
  userService.findUserByEmail.resolves(null)
  await t.throwsAsync(
    async () => {
      await service.updateProjectUserPermission(project.id, user.email, Permission.Admin, true)
    },
    { message: /No such user/ },
  )
})

test.serial('delete project', async (t) => {
  const service = t.context.module.get(ProjectService)

  const projectCreated = await service.create(user, {
    id: faker.internet.domainWord(),
    host: GitHost.Github,
    namespace: faker.internet.domainWord(),
    name: faker.internet.userName(),
    artifactBaselineBranch: 'master',
  })
  await service.deleteProject(projectCreated.id)

  const project = await Project.findOneBy({ id: projectCreated.id })

  t.is(project, null)
})
