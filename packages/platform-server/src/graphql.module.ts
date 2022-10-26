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
import { Module } from '@nestjs/common'
import { GraphQLModule } from '@nestjs/graphql'
import GraphQLJSON from 'graphql-type-json'

import { Config } from './config'
import { LogPlugin } from './graphql'
import { Logger } from './logger'
import { Metric } from './metrics'

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
})
export class GqlModule {}
