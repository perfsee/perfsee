import { faker } from '@faker-js/faker'

import { User, UserConnectedAccount } from '@perfsee/platform-server/db'
import test, { GraphQLTestingClient, initTestDB, create } from '@perfsee/platform-server/test'
import { disconnectAccountMutation, userConnectedAccountsQuery, userQuery } from '@perfsee/schema'
import { ExternalAccount } from '@perfsee/shared'

let gqlClient: GraphQLTestingClient

test.before(async () => {
  await initTestDB()
  gqlClient = new GraphQLTestingClient()
})

test.serial('user', async (t) => {
  const user = await create(User)

  await gqlClient.loginAs(user)

  const result = await gqlClient.query({
    query: userQuery,
  })

  t.is(result.user!.username, user.username)
})

test.serial('connectedAccounts', async (t) => {
  const user = await create(User)
  const githubAccount = await create(UserConnectedAccount, {
    user,
    provider: ExternalAccount.github,
    externUsername: faker.internet.userName(),
    accessToken: faker.internet.password(),
  })

  await gqlClient.loginAs(user)

  const result = await gqlClient.query({
    query: userConnectedAccountsQuery,
  })

  t.is(result.user!.connectedAccounts.length, Object.values(ExternalAccount).length)

  t.is(
    result.user!.connectedAccounts.find((a) => a.provider === ExternalAccount.github)!.externUsername,
    githubAccount.externUsername,
  )
})

test.serial('disconnectAccount', async (t) => {
  const user = await create(User)
  await UserConnectedAccount.create({
    user,
    provider: ExternalAccount.github,
    externUsername: faker.internet.userName(),
    accessToken: faker.internet.password(),
  }).save()

  await gqlClient.loginAs(user)

  const result = await gqlClient.mutate({
    mutation: disconnectAccountMutation,
    variables: {
      provider: ExternalAccount.github,
    },
  })

  t.is(result.disconnectAccount, true)

  const queryResult = await gqlClient.query({
    query: userConnectedAccountsQuery,
  })
  t.is(queryResult.user!.connectedAccounts.find((a) => a.provider === ExternalAccount.github)!.externUsername, null)
})

test.serial('avatarUrl', async (t) => {
  const user = await create(User)

  await gqlClient.loginAs(user)

  const result = await gqlClient.query({
    query: userQuery,
  })

  t.is(result.user!.avatarUrl, user.avatarUrl)
})
