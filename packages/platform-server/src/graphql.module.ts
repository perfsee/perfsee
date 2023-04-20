/*
Copyright 2022 ByteDance and/or its affiliates.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import { join } from 'path'

import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo'
import { Global, Injectable, Module } from '@nestjs/common'
import { ModuleRef } from '@nestjs/core'
import { AbstractGraphQLDriver, GraphQLModule } from '@nestjs/graphql'
import GraphQLJSON from 'graphql-type-json'

import { Config } from './config'
import type { User } from './db'
import { GraphQLQuery, LogPlugin, QueryResponse, RequestOptions } from './graphql'
import { Logger } from './logger'
import { Metric } from './metrics'

@Injectable()
export class GqlService {
  private graphqlAdapter: ApolloDriver | undefined
  constructor(private readonly moduleRef: ModuleRef) {}

  /**
   * Run a graphql query without http. Used in the webhook module.
   */
  async query<Q extends GraphQLQuery>({ query, variables }: RequestOptions<Q>): Promise<QueryResponse<Q>> {
    if (!this.graphqlAdapter) {
      this.graphqlAdapter = this.moduleRef.get(AbstractGraphQLDriver, { strict: false }) as ApolloDriver
    }
    const response = await this.graphqlAdapter.instance.executeOperation(
      {
        query: query.query,
        variables,
        operationName: query.operationName,
      },
      { contextValue: { req: { session: { user: { isAdmin: true, isApp: true } as User } } } },
    )

    if (response.body.kind !== 'single') {
      throw new Error('only single query supported')
    }

    const { data, errors } = response.body.singleResult
    if (data) {
      return data as QueryResponse<Q>
    }
    if (errors) {
      throw new Error(errors?.[0]?.message ?? JSON.stringify(errors))
    }
    throw new Error('Never')
  }
}

@Global()
@Module({
  imports: [
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      useFactory(config: Config, metrics: Metric, logger: Logger) {
        return {
          ...config.graphql,
          path: `${config.path}/graphql`,
          autoSchemaFile: join(__dirname, '..', '..', 'schema', 'src', 'server-schema.gql'),
          resolvers: { JSON: GraphQLJSON },
          plugins: [new LogPlugin(metrics, logger)],
        }
      },
      inject: [Config, Metric, Logger],
    }),
  ],
  providers: [GqlService],
  exports: [GqlService],
})
export class GqlModule {}
