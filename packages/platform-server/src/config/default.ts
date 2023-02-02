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

import { PerfseeConfig } from './def'

export const getDefaultPerfseeConfig: () => PerfseeConfig = () => ({
  version: require('../../package.json').version,
  ENV_MAP: {},
  secret: 'perfsee app secret',
  env: process.env.NODE_ENV ?? 'production',
  get prod() {
    return this.env === 'production'
  },
  get dev() {
    return this.env === 'development'
  },
  get test() {
    return this.env === 'test'
  },
  get deploy() {
    return !this.dev && !this.test
  },
  https: false,
  host: 'localhost',
  port: 3000,
  path: '',
  get origin() {
    return this.dev
      ? 'http://localhost:8080'
      : `${this.https ? 'https' : 'http'}://${this.host}${this.host === 'localhost' ? `:${this.port}` : ''}`
  },
  get baseUrl() {
    return `${this.origin}${this.path}`
  },
  graphql: {
    buildSchemaOptions: {
      numberScalarMode: 'integer',
    },
    introspection: true,
    playground: true,
    debug: true,
  },
  mysql: {
    host: '127.0.0.1',
    port: 3306,
    username: 'root',
    database: 'perfsee',
  },
  redis: {
    host: '127.0.0.1',
    port: 6379,
    password: void 0,
    db: 0,
  },
  auth: {
    enableSignup: true,
    enableOauth: false,
    oauthProviders: {},
    admin: {
      email: 'admin@perfsee.com',
      password: 'admin',
    },
  },
  objectStorage: {
    enable: false,
    artifact: {},
  },
  project: {
    enableCreate: true,
    enableDelete: true,
    enableImport: false,
    externalProviders: ['github'],
  },
  job: {
    pollingLimit: 10,
    pollingQueueLimit: 10,
    pollingTimeoutSec: 5,
    executionTimeoutSec: 1800,
    defaultZone: 'China',
    zones: ['China'],
  },
  runner: {
    validateRegistrationToken: process.env.NODE_ENV !== 'development',
  },
  email: {
    enable: false,
    smtp: {
      host: 'smtp.example.com',
      port: 465,
      secure: true,
      auth: {
        user: '',
        password: '',
      },
    },
    from: {
      name: 'Perfsee',
      address: 'no-reply@perfsee.com',
    },
  },
  integration: {
    github: {
      enable: false,
      appName: 'perfsee',
      appId: 'github app id',
      privateKeyFile: './perfsee.pem',
    },
  },
})
