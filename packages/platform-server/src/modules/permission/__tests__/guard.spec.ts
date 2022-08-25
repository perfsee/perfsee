import { ApolloDriver } from '@nestjs/apollo'
import { Controller, Get, HttpStatus, INestApplication, Param } from '@nestjs/common'
import { Args, Query, ObjectType, Resolver, GraphQLModule, Field } from '@nestjs/graphql'
import { Test } from '@nestjs/testing'
import ava, { TestFn } from 'ava'
import Sinon from 'sinon'
import request from 'supertest'

import { GraphQLTestingClient } from '@perfsee/platform-server/test'

import { PermissionModule } from '..'
import { AuthService } from '../../auth/auth.service'
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
    providers: [AuthService, TestTypeResolver, TestTypeAdminResolver],
  })
    .overrideProvider(PermissionProvider)
    .useValue({ check: Sinon.stub().resolves(true) })
    .overrideProvider(AuthService)
    .useValue({ getUserFromContext: Sinon.stub().resolves({ isAdmin: false }) })
    .compile()
  const app = moduleRef.createNestApplication()
  await app.init()

  t.context = {
    app,
    gqlClient: new GraphQLTestingClient(app.getHttpServer()),
  }
})

test('should apply guard for single query', async (t) => {
  const { app, gqlClient } = t.context
  const permission = app.get(PermissionGuardImpl)
  Sinon.stub(permission, 'canActivate').resolves(false)

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
  const { app, gqlClient } = t.context
  const permission = app.get(PermissionGuardImpl)
  Sinon.stub(permission, 'canActivate').resolves(false)

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
  const { app, gqlClient } = t.context
  const auth = app.get<Sinon.SinonStubbedInstance<AuthService>>(AuthService)
  auth.getUserFromContext.resolves(null)

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
  const { app, gqlClient } = t.context
  const auth = app.get<Sinon.SinonStubbedInstance<AuthService>>(AuthService)
  const permission = app.get<Sinon.SinonStubbedInstance<PermissionProvider>>(PermissionProvider)
  // @ts-expect-error - not all user fields are used
  auth.getUserFromContext.resolves({ isAdmin: true })

  const res = await gqlClient.query({
    // @ts-expect-error
    query: {
      operationName: 'get',
      definitionName: 'get',
      query: `query get { get(projectId: "1") }`,
    },
  })

  t.assert(res)
  t.assert(permission.check.notCalled)
})

test('should pass query if permission.check resolves true', async (t) => {
  const { app, gqlClient } = t.context
  const permission = app.get<Sinon.SinonStubbedInstance<PermissionProvider>>(PermissionProvider)

  const res = await gqlClient.query({
    // @ts-expect-error
    query: {
      operationName: 'get',
      definitionName: 'get',
      query: `query get { get(projectId: "1") }`,
    },
  })

  t.assert(res)
  t.deepEqual(permission.check.args[0], [{ isAdmin: false }, '1', Permission.Read])
})

test('should fail query if permission.check resolves false', async (t) => {
  const { app, gqlClient } = t.context
  const permission = app.get<Sinon.SinonStubbedInstance<PermissionProvider>>(PermissionProvider)
  permission.check.resolves(false)

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
  t.deepEqual(permission.check.args[0], [{ isAdmin: false }, '1', Permission.Read])
})

test('should fail controller if permission.check resolves false', async (t) => {
  const { app } = t.context
  const permission = app.get<Sinon.SinonStubbedInstance<PermissionProvider>>(PermissionProvider)
  permission.check.resolves(false)

  const res = await request(app.getHttpServer()).get(`/test/1`).send()

  t.is(res.statusCode, HttpStatus.FORBIDDEN)
  t.deepEqual(permission.check.args[0], [{ isAdmin: false }, '1', Permission.Read])
})
