import { faker } from '@faker-js/faker'

import { AccessToken, Application, Project, User, UserPermission } from '@perfsee/platform-server/db'
import test, { create, createDBTestingModule, createMock, DeepMocked, initTestDB } from '@perfsee/platform-server/test'

import { AuthService } from '../../auth/auth.service'
import { Permission, PermissionProvider } from '../../permission'
import { ProjectService } from '../../project/service'
import { ApplicationService } from '../service'

let application: Application
let project: Project

test.before(async (t) => {
  t.context.module = await createDBTestingModule({
    providers: [ApplicationService],
  })
    .useMocker(createMock)
    .compile()

  await initTestDB()

  application = await create(User, {
    isApp: true,
  })
  project = await Project.findOneByOrFail({ id: 1 })
})

test.afterEach((t) => {
  const permissionProvider: DeepMocked<PermissionProvider> = t.context.module.get(PermissionProvider)

  permissionProvider.grant.reset()
  permissionProvider.revoke.reset()
})

test.serial('create application', async (t) => {
  const service = t.context.module.get(ApplicationService)
  const authService = t.context.module.get(AuthService)

  const name = faker.internet.userName()
  const token = faker.internet.password()

  authService.generateToken.resolves(token)

  const app = await service.createApplication(name)

  t.is(app.token, token)
  t.is(app.application.username, name)

  await AccessToken.delete({ userId: app.application.id })
  await User.delete({ id: app.application.id })
  t.pass()
})

test.serial('get applications', async (t) => {
  const service = t.context.module.get(ApplicationService)

  const [applications, count] = await service.getApplications({ first: 10, skip: 0, after: null })

  t.is(count, 1)
  t.is(applications.length, 1)
  t.is(applications[0].username, application.username)
})

test.serial('auth application', async (t) => {
  const service = t.context.module.get(ApplicationService)
  const projectService = t.context.module.get(ProjectService)
  const permissionProvider: DeepMocked<PermissionProvider> = t.context.module.get(PermissionProvider)

  projectService.resolveRawProjectIdBySlug.resolves(project.id)
  permissionProvider.grant.resolves()
  await service.authApplication(project.slug, application.id, [Permission.Read])

  t.is(permissionProvider.grant.callCount, 1)
  t.is(permissionProvider.grant.getCall(0).args[0].id, application.id)
  t.is(permissionProvider.grant.getCall(0).args[1], project.id)
  t.is(permissionProvider.grant.getCall(0).args[2], Permission.Read)
})

test.serial('get project authorized applications', async (t) => {
  const service = t.context.module.get(ApplicationService)

  await UserPermission.create({
    userId: application.id,
    projectId: project.id,
    permission: Permission.Read,
  }).save()

  const applications = await service.getAuthorizedApplications(1)

  t.is(applications.length, 1)
  t.is(applications[0].app.id, application.id)
  t.is(applications[0].permissions.length, project.id)
  t.is(applications[0].permissions[0], Permission.Read)
})

test.serial('get application authorized projects', async (t) => {
  const service = t.context.module.get(ApplicationService)

  const projects = await service.getApplicationAuthorizedProjects(application.id)

  t.is(projects.length, 1)
  t.is(projects[0].project.id, project.slug)
})

test.serial('update application permission', async (t) => {
  const service = t.context.module.get(ApplicationService)
  const projectService = t.context.module.get(ProjectService)
  const permissionProvider: DeepMocked<PermissionProvider> = t.context.module.get(PermissionProvider)

  projectService.resolveRawProjectIdBySlug.resolves(project.id)
  permissionProvider.grant.resolves()
  permissionProvider.revoke.resolves()

  await service.updateApplicationPermissions(project.slug, application.id, [Permission.Admin])

  t.is(permissionProvider.revoke.getCall(0).args[2], Permission.Read)
  t.is(permissionProvider.grant.getCall(0).args[2], Permission.Admin)
})

test.serial('revoke application permission', async (t) => {
  const service = t.context.module.get(ApplicationService)
  const projectService = t.context.module.get(ProjectService)
  const permissionProvider: DeepMocked<PermissionProvider> = t.context.module.get(PermissionProvider)

  projectService.resolveRawProjectIdBySlug.resolves(project.id)
  permissionProvider.revoke.resolves()

  await service.revokeApplicationPermissions(project.slug, application.id)

  t.is(permissionProvider.revoke.getCall(0).args[2], Permission.Read)
})
