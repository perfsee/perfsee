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

import { ArgumentsHost, Catch, HttpStatus } from '@nestjs/common'
import { BaseExceptionFilter } from '@nestjs/core'
import { GqlContextType } from '@nestjs/graphql'
import { Response } from 'express'

import { UserError } from '@perfsee/platform-server/error'

@Catch()
export class AnyErrorFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    if (host.getType<GqlContextType>() === 'graphql') {
      // let gqlPlugin.didEncounterErrors handle it
      throw exception
    } else if (exception instanceof UserError) {
      const res = host.switchToHttp().getResponse<Response>()
      res.status(HttpStatus.BAD_REQUEST).send({
        message: exception.message,
      })
    } else {
      super.catch(exception, host)
    }
  }
}
