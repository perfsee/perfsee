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

import { Body, Controller, Post } from '@nestjs/common'
import { ApiExcludeController } from '@nestjs/swagger'
import { v4 as uuid } from 'uuid'

import { User, UserCookies } from '@perfsee/platform-server/db'
import { ObjectStorage } from '@perfsee/platform-server/storage'
import { CookieType } from '@perfsee/shared'

import { Auth, CurrentUser } from '../auth/auth.guard'

@ApiExcludeController()
@Controller('/v1')
export class UserController {
  constructor(private readonly storage: ObjectStorage) {}

  @Auth()
  @Post('uploadCookies')
  async uploadCookies(@Body() body: CookieType[], @CurrentUser() user: User) {
    const storageKey = `user-cookies/${uuid()}.json`
    await this.storage.upload(storageKey, Buffer.from(JSON.stringify(body)))
    await UserCookies.create({
      userId: user.id,
      createdAt: new Date(),
      cookieStorageKey: storageKey,
    }).save()

    return true
  }
}
