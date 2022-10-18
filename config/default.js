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

const { join } = require('path')

const port = parseInt(process.env.HTTP_SERVER_PORT) || 3000
const enableGraphqlIntrospection = process.env.DISABLE_GRAPHQL_INTROSPECTION !== 'true'

const path = process.env.SUB_PATH || ''

module.exports = {
  port,
  host: process.env.HOST || `http://localhost:${port}`,
  path,
  secret: process.env.APP_SECRET_KEY || 'your-application-secret-key',
  /** @type {import('typeorm').ConnectionOptions} */
  mysql: {
    port: parseInt(process.env.MYSQL_PORT) || 3306,
    host: process.env.MYSQL_HOST || '127.0.0.1',
    username: process.env.MYSQL_NAME || 'root',
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DB || 'perfsee',
  },
  /** @type {import('ioredis').RedisOptions} */
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB) || 0,
  },
  objectStorage: {
    bucket: process.env.ARTIFACTS_STORAGE_BUCKET_NAME,
    accessToken: process.env.ARTIFACTS_STORAGE_ACCESS_TOKEN,
  },
  jobLogStorage: {
    bucket: process.env.JOB_LOG_STORAGE_BUCKET_NAME,
    accessToken: process.env.JOB_LOG_STORAGE_ACCESS_TOKEN,
  },
  sourceMapStorage: {
    bucket: process.env.SOURCE_MAP_STORAGE_BUCKET_NAME,
    accessToken: process.env.SOURCE_MAP_STORAGE_ACCESS_TOKEN,
  },
  /** @type {import('@nestjs/apollo').ApolloDriverConfig} */
  graphql: {
    path: path + '/graphql',
    autoSchemaFile: join(__dirname, '..', 'packages', 'schema', 'src', 'server-schema.gql'),
    buildSchemaOptions: {
      numberScalarMode: 'integer',
    },
    introspection: enableGraphqlIntrospection,
    playground: enableGraphqlIntrospection,
    debug: process.env.NODE_ENV === 'development',
  },
  oauth: {
    github: {
      clientId: process.env.GITHUB_OAUTH_CLIENT_ID,
      clientSecret: process.env.GITHUB_OAUTH_CLIENT_SECRET,
      redirectUri: '/oauth2/callback',
      accessTokenUri: 'https://github.com/login/oauth/access_token',
      authorizationUri: 'https://github.com/login/oauth/authorize',
      userInfoUri: 'https://api.github.com/user',
    },
  },
  jobs: {
    jobPollingIntervalSec: parseInt(process.env.JOB_POLLING_INTERVAL_SEC || 5),
    jobPollingTimeoutSec: parseInt(process.env.JOB_POLLING_TIMEOUT_SEC || 3),
    jobPollingLimit: parseInt(process.env.JOB_POLLING_LIMIT || 10),
    jobPollingQueueLimit: parseInt(process.env.JOB_POLLING_QUEUE_LIMIT || 10),
    jobTimeoutSec: parseInt(process.env.JOB_TIMEOUT_SEC || 600),
  },
  email: {
    smtp: {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: Boolean(process.env.SMTP_SECURE || false),
      auth: {
        user: process.env.SMTP_AUTH_USER,
        pass: process.env.SMTP_AUTH_PASS,
      },
    },
    from: {
      name: process.env.EMAIL_FROM_NAME,
      address: process.env.EMAIL_FROM_ADDRESS,
    },
  },
  github: {
    appname: process.env.GITHUB_APPNAME,
    appid: process.env.GITHUB_APPID,
    privateKeyFile: process.env.GITHUB_APP_PRIVATE_KEY_FILE,
  },
}
