import { ApolloDriver } from '@nestjs/apollo'
import { Controller, Get, HttpStatus, INestApplication, Param } from '@nestjs/common'
import { Args, Query, ObjectType, Resolver, GraphQLModule, Field } from '@nestjs/graphql'
import { Test } from '@nestjs/testing'
import ava, { TestFn } from 'ava'
import Sinon from 'sinon'
import request from 'supertest'

import { GraphQLTestingClient } from '@perfsee/platform-server/test'

import { PermissionModule } from '..'
import { Permission } from '../def'
import { PermissionGuard, PermissionGuardImpl } from '../guard'
import { PermissionProvider } from '../providers'

@ObjectType()
class TestType {
  @Field(() => String)
  name!: string
}

@Resolver(() => TestType)
class TestTypeResolver {
  @PermissionGuard(Permission.Read, 'projectId')
  @Query(() => Boolean)
  get(@Args('projectId') id: string) {
    return !!id
  }
}

@Resolver(() => TestType)
@PermissionGuard(Permission.Admin, 'projectId')
class TestTypeAdminResolver {
  @Query(() => Boolean)
  getBoolean() {
    return true
  }
}

@Controller('/test')
class TestController {
  @Get('/:someId')
  @PermissionGuard(Permission.Read, 'someId')
  test(@Param('somdId') _someId: string) {
    return true
  }
}

interface Context {
  app: INestApplication
  gqlClient: GraphQLTestingClient
  guard: PermissionGuardImpl
  provider: { check: Sinon.SinonStub }
}

const test = ava as TestFn<Context>

test.beforeEach(async (t) => {
  const moduleRef = await Test.createTestingModule({
    imports: [
      PermissionModule,
      GraphQLModule.forRoot({
        driver: ApolloDriver,
        debug: false,
        playground: false,
        autoSchemaFile: true,
      }),
    ],
    controllers: [TestController],
    providers: [TestTypeResolver, TestTypeAdminResolver],
  })
    .overrideProvider(PermissionProvider)
    .useValue({ check: Sinon.stub().resolves(true) })
    .compile()
  const app = moduleRef.createNestApplication()
  await app.init()

  t.context = {
    app,
    gqlClient: new GraphQLTestingClient(app.getHttpServer()),
    guard: app.get(PermissionGuardImpl),
    provider: app.get(PermissionProvider),
  }
})

test('should apply guard for single query', async (t) => {
  const { gqlClient, guard } = t.context
  Sinon.stub(guard, 'canActivate').resolves(false)

  await t.throwsAsync(
    gqlClient.query({
      // @ts-expect-error
      query: {
        operationName: 'get',
        definitionName: 'get',
        query: `query get { get(projectId: "1") }`,
      },
    }),
    {
      message: 'Forbidden resource',
    },
  )
})

test('should apply guard for whole resolver', async (t) => {
  const { gqlClient, guard } = t.context
  Sinon.stub(guard, 'canActivate').resolves(false)

  await t.throwsAsync(
    gqlClient.query({
      // @ts-expect-error
      query: {
        operationName: 'getBoolean',
        definitionName: 'getBoolean',
        query: `query getBoolean { getBoolean }`,
      },
    }),
    { message: 'Forbidden resource' },
  )
})

test('should fail if not signed in', async (t) => {
  const { gqlClient, guard } = t.context
  Sinon.stub(guard, 'getUserFromContext').returns(null)

  await t.throwsAsync(
    gqlClient.query({
      // @ts-expect-error
      query: {
        operationName: 'get',
        definitionName: 'get',
        query: `query get { get(projectId: "1") }`,
      },
    }),
    { message: 'Forbidden resource' },
  )
})

test('should fast pass if user is admin', async (t) => {
  const { gqlClient, guard, provider } = t.context
  // @ts-expect-error - not all user fields are used
  Sinon.stub(guard, 'getUserFromContext').returns({ isAdmin: true })

  const res = await gqlClient.query({
    // @ts-expect-error
    query: {
      operationName: 'get',
      definitionName: 'get',
      query: `query get { get(projectId: "1") }`,
    },
  })

  t.assert(res)
  t.assert(provider.check.notCalled)
})

test('should pass query if permission.check resolves true', async (t) => {
  const { gqlClient, guard, provider } = t.context
  // @ts-expect-error - not all user fields are used
  Sinon.stub(guard, 'getUserFromContext').returns({ isAdmin: false })
  provider.check.resolves(true)

  const res = await gqlClient.query({
    // @ts-expect-error
    query: {
      operationName: 'get',
      definitionName: 'get',
      query: `query get { get(projectId: "1") }`,
    },
  })

  t.assert(res)
  t.deepEqual(provider.check.args[0], [{ isAdmin: false }, '1', Permission.Read])
})

test('should fail query if permission.check resolves false', async (t) => {
  const { gqlClient, guard, provider } = t.context

  // @ts-expect-error - not all user fields are used
  Sinon.stub(guard, 'getUserFromContext').returns({ isAdmin: false })
  provider.check.resolves(false)

  await t.throwsAsync(
    gqlClient.query({
      // @ts-expect-error
      query: {
        operationName: 'get',
        definitionName: 'get',
        query: `query get { get(projectId: "1") }`,
      },
    }),
    { message: 'Forbidden resource' },
  )
  t.deepEqual(provider.check.args[0], [{ isAdmin: false }, '1', Permission.Read])
})

test('should fail controller if permission.check resolves false', async (t) => {
  const { app, guard, provider } = t.context
  // @ts-expect-error - not all user fields are used
  Sinon.stub(guard, 'getUserFromContext').returns({ isAdmin: false })
  provider.check.resolves(false)

  const res = await request(app.getHttpServer()).get(`/test/1`).send()

  t.is(res.statusCode, HttpStatus.FORBIDDEN)
  t.deepEqual(provider.check.args[0], [{ isAdmin: false }, '1', Permission.Read])
})
