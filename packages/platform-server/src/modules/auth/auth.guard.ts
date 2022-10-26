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

import { Injectable, CanActivate, ExecutionContext, createParamDecorator, UseGuards, SetMetadata } from '@nestjs/common'
import { Reflector } from '@nestjs/core'

import { getRequestFromContext } from '@perfsee/platform-server/nestjs-extends'

import { AuthService } from './auth.service'

const SKIP_AUTH = 'SKIP_AUTH'

export const SkipAuth = (_reason: string) => {
  return SetMetadata(SKIP_AUTH, true)
}

export function getUserFromContext(context: ExecutionContext) {
  const req = getRequestFromContext(context)
  return req.user ?? req.session?.user
}

export class PreAuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext) {
    await this.auth.getUserFromContext(context)
    return true
  }
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    if (this.reflector.get<boolean>(SKIP_AUTH, context.getHandler())) {
      return true
    }

    return !!getUserFromContext(context)
  }
}

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    if (this.reflector.get<boolean>(SKIP_AUTH, context.getHandler())) {
      return true
    }

    const user = getUserFromContext(context)

    return user?.isAdmin ?? false
  }
}

export const CurrentUser = createParamDecorator((_: unknown, context: ExecutionContext) => {
  return getUserFromContext(context)
})

export const Auth = (role?: 'admin') => {
  if (role === 'admin') {
    return UseGuards(AdminGuard)
  }

  return UseGuards(AuthGuard)
}
