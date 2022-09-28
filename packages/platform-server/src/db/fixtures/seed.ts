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

import {
  AccessToken,
  ApplicationSetting,
  Environment,
  Page,
  PageWithCompetitor,
  PageWithEnv,
  PageWithProfile,
  Profile,
  Project,
  User,
} from '../mysql'

import { create } from './factory'

export async function seed() {
  return Promise.all([create(ApplicationSetting), seedUsers(), seedProject()])
}

export async function seedUsers() {
  const [admin, user] = await create(User, [
    {
      username: 'admin',
      email: 'admin@example.org',
      isAdmin: true,
    },
    {
      username: 'user',
      email: 'user@example.org',
    },
  ])

  await create(AccessToken, [
    {
      user: admin,
      name: 'test-token',
      token: 'uadmin-test-token',
    },
    {
      user,
      name: 'test-token',
      token: 'unormaluser-test-token',
    },
  ])

  return [admin, user]
}

export async function seedProject() {
  const project = await create(Project, {
    id: 1,
  })

  return [project]
}

export async function seedProjectProperty(projectId = 1) {
  return Promise.all([
    create(Page, [
      { projectId, id: 1, iid: 1 },
      { projectId, id: 2, iid: 2 },
      { projectId, id: 3, disable: true },
      { projectId, id: 4, isCompetitor: true },
      { projectId, id: 5, isTemp: true },
    ]),
    create(Environment, [
      { projectId, id: 1, iid: 1 },
      { projectId, id: 2, iid: 2 },
      { projectId, id: 3, disable: true },
      { projectId, id: 4, isCompetitor: true },
    ]),
    create(Profile, [
      { projectId, id: 1, iid: 1 },
      { projectId, id: 2, iid: 2 },
      { projectId, id: 3, disable: true },
    ]),
    create(PageWithEnv, [
      {
        pageId: 1,
        envId: 1,
      },
      {
        pageId: 1,
        envId: 2,
      },
      {
        pageId: 3,
        envId: 1,
      },
      {
        pageId: 4,
        envId: 4,
      },
    ]),
    create(PageWithProfile, [
      { pageId: 1, profileId: 1 },
      { pageId: 1, profileId: 2 },
      { pageId: 3, profileId: 1 },
      { pageId: 4, profileId: 1 },
    ]),
    create(PageWithCompetitor, { pageId: 1, competitorId: 4 }),
  ])
}
