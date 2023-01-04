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

import { applyDecorators, CanActivate, ExecutionContext, Injectable, SetMetadata, UseGuards } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { GqlContextType, GqlExecutionContext } from '@nestjs/graphql'
import { Request } from 'express'

import { User } from '@perfsee/platform-server/db'

import { getUserFromContext } from '../auth'

import { Permission } from './def'
import { PermissionProvider } from './providers'

const GuardParamsName = 'GuardParams'

type PermissionGuardParams = [Permission, string] | [Permission, string, boolean]

export const PermissionGuard = (...params: PermissionGuardParams) => {
  return applyDecorators(SetMetadata(GuardParamsName, params), UseGuards(PermissionGuardImpl))
}

@Injectable()
export class PermissionGuardImpl implements CanActivate {
  constructor(private readonly permission: PermissionProvider, private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const user =
      this.getUserFromContext(context) ??
      ({
        id: 0,
        isAdmin: false,
        isApp: false,
        username: 'anonymous',
        email: 'anonymous@perfsee.com',
      } as User)

    if (user.isAdmin) {
      return true
    }

    const [permission, idParamName, isGroup] = this.reflector.get<PermissionGuardParams>(
      GuardParamsName,
      context.getHandler(),
    )
    if (!permission) {
      throw new Error('PermissionGuard should be used in Permission decorator with [Permissions] as parameters!')
    }

    const requestType = context.getType<GqlContextType>()
    let params = {}
    switch (requestType) {
      case 'graphql':
        params = GqlExecutionContext.create(context).getArgs()
        break
      case 'http':
        params = context.switchToHttp().getRequest<Request>().params
        break
      default:
        throw new Error(`PermissionGuard is not supported in this request type: '${requestType}'`)
    }

    const id = params[idParamName]
    if (!id) {
      throw new Error(`"${idParamName}" is requested for PermissionGuard`)
    }

    return this.permission.check(user, id, permission, isGroup)
  }

  /**
   * for easier test mocking
   */
  getUserFromContext(context: ExecutionContext) {
    return getUserFromContext(context)
  }
}
