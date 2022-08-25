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

import { BundleJobStatus } from '@perfsee/server-common'

import { Artifact } from '../mysql'

import { registerEntityFactory } from './factory'

registerEntityFactory(Artifact, () =>
  Artifact.create({
    projectId: 1,
    iid: faker.unique(faker.datatype.number, [{ min: 1 }]),
    hash: faker.git.commitSha(),
    branch: faker.git.branch(),
    issuer: faker.internet.email(),
    tag: faker.system.semver(),
    name: 'main',
    buildKey: faker.system.commonFileName('tar'),
    status: BundleJobStatus.Pending,
  }),
)
