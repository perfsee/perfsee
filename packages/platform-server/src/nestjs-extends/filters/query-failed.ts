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

import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common'
import { GqlContextType } from '@nestjs/graphql'
import { QueryFailedError } from 'typeorm'

@Catch(QueryFailedError)
export class QueryErrorFilter implements ExceptionFilter {
  catch(exception: QueryFailedError, host: ArgumentsHost) {
    if (host.getType() === 'http') {
      throw new HttpException({}, HttpStatus.INTERNAL_SERVER_ERROR)
    } else if (host.getType<GqlContextType>() === 'graphql') {
      const error = new Error('DB query execution meets error')
      error.stack = exception.stack
      return error
    }
  }
}
