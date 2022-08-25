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

import { ExternalAccount } from '@perfsee/shared'

import { UserConnectedAccount } from '../mysql'

import { registerEntityFactory } from './factory'

registerEntityFactory(UserConnectedAccount, () =>
  UserConnectedAccount.create({
    provider: ExternalAccount.github,
    externUsername: faker.internet.userName(),
    accessToken: faker.internet.password(),
  }),
)
