import { faker } from '@faker-js/faker'

import { Organization, User, Profile, Environment, Setting, UsagePack } from '@perfsee/platform-server/db'
import { InternalIdService } from '@perfsee/platform-server/helpers'
import { Metric } from '@perfsee/platform-server/metrics'
import test, { createMock, initTestDB, createDBTestingModule, DeepMocked, create } from '@perfsee/platform-server/test'
import { GitHost } from '@perfsee/shared'

import { PermissionProvider, Permission } from '../../permission'
import { UserService } from '../../user'
import { OrganizationService } from '../service'

let organization: Organization
let user: User

test.before(async (t) => {
  t.context.module = await createDBTestingModule({
    providers: [OrganizationService],
  })
    .useMocker(createMock)
    .compile()

  await initTestDB()

  user = await create(User)
  organization = await create(Organization)
})

test.serial('create organization', async (t) => {
  const service = t.context.module.get(OrganizationService)
  const internalIdService = t.context.module.get(InternalIdService)
  const metricService = t.context.module.get(Metric)

  internalIdService.generate.resolves(1)

  const organizationCreated = await service.create(user, {
    id: faker.internet.domainWord(),
    host: GitHost.Github,
    namespace: faker.internet.domainWord(),
    name: faker.internet.userName(),
    artifactBaselineBranch: 'master',
  })

  // 1 for profile & 1 for environment
  t.is(internalIdService.generate.callCount, 2)

  const profiles = await Profile.findBy({ organizationId: organizationCreated.id })
  t.is(profiles.length, 1)

  const envs = await Environment.findBy({ organizationId: organizationCreated.id })
  t.is(envs.length, 1)

  const settings = await Setting.findBy({ organizationId: organizationCreated.id })
  t.is(settings.length, 1)

  t.is(metricService.newOrganization.getCall(0).args[0], 1)

  const defaultUsagePack = await UsagePack.findOneByOrFail({ isDefault: true })
  t.is(organizationCreated.usagePackId, defaultUsagePack.id)

  // clear
  await Profile.delete({ organizationId: organizationCreated.id })
  await Environment.delete({ organizationId: organizationCreated.id })
  await Setting.delete({ organizationId: organizationCreated.id })
  await Organization.delete({ id: organizationCreated.id })
})

test.serial('create existed organization', async (t) => {
  const service = t.context.module.get(OrganizationService)

  await t.throwsAsync(
    async () => {
      await service.create(user, {
        id: organization.slug,
        host: GitHost.Github,
        name: faker.internet.domainWord(),
        namespace: faker.internet.userName(),
        artifactBaselineBranch: 'master',
      })
    },
    { instanceOf: Error },
  )
})

test.serial('get organization', async (t) => {
  const service = t.context.module.get(OrganizationService)

  const organizationResult = await service.getOrganization(organization.slug)
  t.truthy(organizationResult)

  const organizationById = await service.getOrganizationById(organization.id)
  t.truthy(organizationById)
  t.is(organization.slug, organizationById!.slug)

  const organizationsByRepo = await service.getOrganizationsByRepo(
    organization.host,
    organization.namespace,
    organization.name,
  )
  t.truthy(organizationById)
  t.is(organizationsByRepo.length, 1)
  t.is(organization.slug, organizationsByRepo[0].slug)

  const organizationId = await service.resolveRawOrganizationIdBySlug(organization.slug)
  t.is(organizationId, organization.id)
})

test.serial('get organizations', async (t) => {
  const service = t.context.module.get(OrganizationService)
  const permissionProvider: DeepMocked<PermissionProvider> = t.context.module.get(PermissionProvider)

  const pagination = { skip: 0, first: 10, after: null }

  // no permission user
  permissionProvider.userAllowList.resolves([])
  const [emptyOrganizations, emptyCount] = await service.getOrganizations(user, pagination)

  t.is(emptyOrganizations.length, 0)
  t.is(emptyCount, 0)

  // user with permission
  permissionProvider.userAllowList.resolves([organization.id])
  const [organizations, count] = await service.getOrganizations(user, pagination)

  t.is(organizations.length, 1)
  t.is(count, 1)

  // user not star any organization
  const [, count2] = await service.getOrganizations(user, pagination, '', true)

  t.is(count2, 0)

  // star a organization
  await service.toggleStarOrganization(user.id, organization.slug, true)
  const [[starredOrganization], count3] = await service.getOrganizations(user, pagination, '', true)

  t.is(starredOrganization.id, organization.id)
  t.is(count3, 1)

  // cancel star a organization
  await service.toggleStarOrganization(user.id, organization.slug, false)
  const [, count4] = await service.getOrganizations(user, pagination, '', true)

  t.is(count4, 0)
})

test.serial('update organization', async (t) => {
  const service = t.context.module.get(OrganizationService)

  // update organization info
  await service.update(organization.id, { artifactBaselineBranch: 'test' })
  organization = await Organization.findOneByOrFail({ id: organization.id })

  t.is(organization!.artifactBaselineBranch, 'test')
})

test.serial('check permission', async (t) => {
  const service = t.context.module.get(OrganizationService)
  const permissionProvider: DeepMocked<PermissionProvider> = t.context.module.get(PermissionProvider)

  const body = {
    user,
    slug: organization.slug,
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
  const service = t.context.module.get(OrganizationService)
  const permissionProvider: DeepMocked<PermissionProvider> = t.context.module.get(PermissionProvider)

  permissionProvider.get.resolves([Permission.Admin])

  const permissions = await service.getUserPermission(user, organization)

  t.deepEqual(permissions, [Permission.Admin])
})

test.serial('organization owners', async (t) => {
  const service = t.context.module.get(OrganizationService)
  const permissionProvider: DeepMocked<PermissionProvider> = t.context.module.get(PermissionProvider)

  // return userId
  permissionProvider.organizationAllowList.resolves([user.id])
  const owners = await service.getOrganizationUsers(organization, Permission.Admin)

  t.is(owners.length, 1)
  t.is(owners[0].username, user.username)

  // return user email
  permissionProvider.organizationAllowList.resolves([user.email])
  const ownersWithEmail = await service.getOrganizationUsers(organization, Permission.Admin)

  t.is(ownersWithEmail.length, 1)
  t.is(ownersWithEmail[0].username, user.username)
})

test.serial('organization viewers', async (t) => {
  const service = t.context.module.get(OrganizationService)
  const permissionProvider: DeepMocked<PermissionProvider> = t.context.module.get(PermissionProvider)

  // return userId
  permissionProvider.organizationAllowList.resolves([user.id])
  const viewers = await service.getOrganizationUsers(organization, Permission.Read)

  t.is(viewers.length, 1)
  t.is(viewers[0].username, user.username)

  // return user email
  permissionProvider.organizationAllowList.resolves([user.email])
  const viewersWithEmail = await service.getOrganizationUsers(organization, Permission.Read)

  t.is(viewersWithEmail.length, 1)
  t.is(viewersWithEmail[0].username, user.username)
})

test.serial('update organization user permission', async (t) => {
  const service = t.context.module.get(OrganizationService)
  const userService = t.context.module.get(UserService)
  const permissionProvider: DeepMocked<PermissionProvider> = t.context.module.get(PermissionProvider)

  // add permission
  await service.updateOrganizationUserPermission(organization.id, user.email, Permission.Admin, true)
  t.truthy(permissionProvider.grant.calledOnce)

  // revoke permission
  permissionProvider.check.resolves(true)
  await service.updateOrganizationUserPermission(organization.id, user.email, Permission.Admin, false)
  t.truthy(permissionProvider.revoke.calledOnce)

  // grant already existed permission
  permissionProvider.check.resolves(true)
  await t.throwsAsync(
    async () => {
      await service.updateOrganizationUserPermission(organization.id, user.email, Permission.Admin, true)
    },
    { message: /User already has this permission/ },
  )

  // revoke not existed permission
  permissionProvider.check.resolves(false)
  await t.throwsAsync(
    async () => {
      await service.updateOrganizationUserPermission(organization.id, user.email, Permission.Admin, false)
    },
    { message: /User do not has this permission/ },
  )

  // error user email
  userService.findUserByEmail.resolves(null)
  await t.throwsAsync(
    async () => {
      await service.updateOrganizationUserPermission(organization.id, user.email, Permission.Admin, true)
    },
    { message: /No such user/ },
  )
})

test.serial('delete organization', async (t) => {
  const service = t.context.module.get(OrganizationService)

  const organizationCreated = await service.create(user, {
    id: faker.internet.domainWord(),
    host: GitHost.Github,
    namespace: faker.internet.domainWord(),
    name: faker.internet.userName(),
    artifactBaselineBranch: 'master',
  })
  await service.deleteOrganization(organizationCreated.id)

  const organization = await Organization.findOneBy({ id: organizationCreated.id })

  t.is(organization, null)
})
