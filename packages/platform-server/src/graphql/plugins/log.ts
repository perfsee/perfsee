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

import { ApolloServerPlugin, GraphQLRequestListener, GraphQLRequestContext } from '@apollo/server'
import { Plugin } from '@nestjs/apollo'

import { isUserError } from '@perfsee/platform-server/error/user-error'
import { Logger } from '@perfsee/platform-server/logger'
import { Metric } from '@perfsee/platform-server/metrics'

@Plugin()
export class LogPlugin implements ApolloServerPlugin {
  constructor(private readonly metrics: Metric, private readonly logger: Logger) {}

  requestDidStart(
    reqContext: GraphQLRequestContext<{ req: Express.Request }>,
  ): Promise<GraphQLRequestListener<GraphQLRequestContext<{ req: Express.Request }>>> {
    const operationName = reqContext.request.operationName
    const endTimer = this.metrics.gqlRequestTime({ operationName })
    this.metrics.gqlRequest(1, { operationName })

    return Promise.resolve({
      willSendResponse: () => {
        endTimer()
        this.metrics.gqlRequestSuccess(1, { operationName })
        return Promise.resolve()
      },
      didEncounterErrors: (ctx) => {
        endTimer()
        ctx.errors.forEach((err) => {
          if (!isUserError(err)) {
            this.logger.error(err.originalError ?? err, { operationName })
          }
        })
        this.metrics.gqlRequestFail(1, { operationName })
        return Promise.resolve()
      },
    })
  }
}
