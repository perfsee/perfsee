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

import { faker } from '@faker-js/faker'
import config from 'config'
import request from 'supertest'

import { AccessToken, Application, User } from '../db'

export class TestingClient {
  protected presetHeaders: { [key: string]: string } = {
    // default login status is admin user created in ../db/fixtures/seed.ts
    Authorization: 'Bearer uadmin-test-token',
  }

  constructor(protected appServer: any = config.host) {}

  request(): request.SuperTest<request.Test> {
    return request(this.appServer)
  }

  async loginAs(user: User | Application) {
    const token = await AccessToken.create({
      user,
      name: faker.internet.password(),
      token: 'u' + faker.internet.password(),
    }).save()
    this.setAuthToken(token.token)
  }

  setAuthToken(token: string) {
    this.presetHeaders.Authorization = `Bearer ${token}`
  }

  logout() {
    delete this.presetHeaders.Authorization
  }
}
