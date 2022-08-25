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

declare module 'config' {
  export const testing: boolean | undefined
  // platform deployed host
  export const host: string
  // platform deployed subpath
  export const path: string
  export const port: number
  export const secret: string

  export const mysql: Extract<import('typeorm').DataSourceOptions, { type: 'mysql' | 'mariadb' }>
  export const redis: import('ioredis').RedisOptions
  export const graphql: import('@nestjs/apollo').ApolloDriverConfig

  interface ObjectStorageConfig {
    bucket: string
    accessToken: string
  }

  export const objectStorage: ObjectStorageConfig
  export const jobLogStorage: ObjectStorageConfig

  interface OAuthConfig {
    readonly clientId: string
    readonly clientSecret: string
    readonly redirectUri: string
    accessTokenUri: string
    authorizationUri: string
    userInfoUri: string
  }

  export const oauth: {
    github: OAuthConfig
  }

  export const jobs: {
    jobPollingIntervalSec: number
    jobPollingLimit: number
    jobPollingQueueLimit: number
    jobPollingTimeoutSec: number
    jobTimeoutSec: number
  }

  export const email: {
    smtp: {
      host: string
      port: number
      secure: boolean
      auth: {
        user: string
        pass: string
      }
    }
    from: {
      name: string
      address: string
    }
  }

  export const github: {
    appname: string
    appid: string
    privateKeyFile: string
  }
}
