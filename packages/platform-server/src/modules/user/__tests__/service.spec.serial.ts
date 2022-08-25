import { faker } from '@faker-js/faker'
import { isMatch, omit } from 'lodash'

import { User, UserConnectedAccount } from '@perfsee/platform-server/db'
import test, { create, createDBTestingModule, createMock, initTestDB } from '@perfsee/platform-server/test'
import { ExternalAccount } from '@perfsee/shared'

import { UserService } from '../service'

let user: User
let githubAccount: UserConnectedAccount

test.beforeEach(async (t) => {
  t.context.module = await createDBTestingModule({
    providers: [UserService],
  })
    .useMocker(createMock)
    .compile()

  await initTestDB()

  user = await create(User)
  githubAccount = await UserConnectedAccount.create({
    user,
    provider: ExternalAccount.github,
    externUsername: faker.internet.userName(),
    accessToken: faker.internet.password(),
  }).save()
})

test.serial('findUserByEmail', async (t) => {
  const user = await create(User)
  t.deepEqual((await t.context.module.get(UserService).findUserByEmail(user.email))?.username, user.username)
})

test.serial('findUserById', async (t) => {
  t.deepEqual((await t.context.module.get(UserService).findUserById(user.id))?.username, user.username)
})

test.serial('findUserByExternUsername', async (t) => {
  t.deepEqual(
    (
      await t.context.module
        .get(UserService)
        .findUserByExternUsername(ExternalAccount.github, githubAccount.externUsername)
    )?.username,
    user.username,
  )
})

test.serial('getUserConnectedAccounts', async (t) => {
  t.true(isMatch(await t.context.module.get(UserService).getUserConnectedAccounts(user), [omit(githubAccount, 'user')]))
})

test.serial('getUserConnectedAccount', async (t) => {
  t.true(
    isMatch(
      (await t.context.module.get(UserService).getUserConnectedAccount(user, ExternalAccount.github))!,
      omit(githubAccount, 'user'),
    ),
  )
})

test.serial('createUser', async (t) => {
  const userInput = {
    username: faker.internet.userName(),
    email: faker.internet.email(),
    avatarUrl: faker.image.avatar(),
  }
  const user = await t.context.module.get(UserService).createUser(userInput)
  t.true(isMatch((await User.findOneBy({ id: user.id }))!, userInput))
})

test.serial('updateUserPassword', async (t) => {
  const password = faker.internet.password()
  await t.context.module.get(UserService).updateUserPassword(user, password)
  t.deepEqual(
    await User.createQueryBuilder('user')
      .select('user.password', 'password')
      .where({
        id: user.id,
      })
      .getRawOne(),
    { password },
  )
})

test.serial('connectAccount', async (t) => {
  const userService = t.context.module.get(UserService)
  const username = faker.internet.userName()
  const token = faker.internet.password()
  await userService.connectAccount(user, ExternalAccount.github, username, token)
  t.truthy(
    await UserConnectedAccount.findOneBy({
      provider: ExternalAccount.github,
      externUsername: username,
      accessToken: token,
    }),
  )
})

test.serial('disconnectAccount', async (t) => {
  const userService = t.context.module.get(UserService)
  await userService.disconnectAccount(user, ExternalAccount.github)
  t.falsy(
    await UserConnectedAccount.findOneBy({
      provider: ExternalAccount.github,
    }),
  )
})

test.serial('getUserPassword', async (t) => {
  t.deepEqual(await t.context.module.get(UserService).getUserPassword(user), user.password)
})
