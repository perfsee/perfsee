---
sidebar_position: 3
---

# 配置

Perfsee 运行时配置主要来源有三个：配置文件、环境变量和数据库，他们会按顺序被加载，后加载的数据会对之前的配置进行覆盖。

1. 加载 `./packages/platform-server/src/config/default.ts` 文件中的默认配置
2. 加载 `./packages/platform-server/src/perfsee.config.ts` 文件中的自定义配置
3. 加载环境变量，依据 `packages/platform-server/src/perfsee.env.ts` 中的定义去覆盖配置
4. 加载数据库 ApplicationSetting 表中的配置

## 修改配置

### 新增配置项

如果需要新增配置项，应在 `./packages/platform-server/src/config/def.ts` 中相应的位置声明其类型并添加上详细的配置说明及使用方式。

```typescript
// 例
export interface PerfseeConfig {
  /**
   * new config used for xxx
   */
  newConfig: {
    /**
     * config field
     *
     * @default 'default value'
     * @env PERFSEE_NEW_CONFIG_FIELD
     * @see https://docs.for.such.config
     */
    field: string
  }
}
```

### 修改配置文件

配置文件存放位置为 `./packages/platform-server/src/perfsee.config.ts`，可以根据自己的需求修改其中的配置。

:::caution
配置文件的修改需要在服务重新启动后生效
:::

```typescript
perfsee.newConfig = {
  field: 'new value',
}
```

### 修改数据库配置

我们提供了[管理员界面](https://perfsee.com/admin)，可以在其中修改存储在数据库中的配置，修改后的配置会被保存到数据库中，并且立即生效。

## 配置项说明

### 基础配置

| 配置名 | 类型    | 环境变量                | 默认值       | 说明                                                       |
| ------ | ------- | ----------------------- | ------------ | ---------------------------------------------------------- |
| secret | string  | PERFSEE_SERVER_SECRET   |              | 加密密钥，用于加密 cookies, tokens 等数据                  |
| https  | boolean | PERFSEE_SERVER_HTTPS    | false        | 是否启用 https                                             |
| host   | string  | PERFSEE_SERVER_HOST     | localhost    | 服务器部署的域名                                           |
| port   | number  | PERFSEE_SERVER_PORT     | 3000         | 服务器监听的端口                                           |
| path   | string  | PERFSEE_SERVER_SUB_PATH | ''(空字符串) | 服务器部署的子路径，如果没有部署在根路径，那么需要设置此项 |

```
// 例
perfsee.https = true
perfsee.host = 'perfsee.com'
```

### MySQL

所有的 MySQL 配置均在 `perfsee.mysql` 对象中设置。

| 配置名         | 类型   | 环境变量       | 默认值    | 说明                                                       |
| -------------- | ------ | -------------- | --------- | ---------------------------------------------------------- |
| mysql.host     | string | MYSQL_HOST     | localhost | 数据库地址                                                 |
| mysql.port     | number | MYSQL_PORT     | 3306      | 数据库端口                                                 |
| mysql.username | string | MYSQL_USERNAME | root      | 数据库用户名                                               |
| mysql.password | string | MYSQL_PASSWORD | root      | 数据库密码                                                 |
| mysql.database | string | MYSQL_DATABASE | perfsee   | 数据库名称                                                 |
| mysql.url      | string | MYSQL_URL      |           | 数据库连接地址，如果设置了此项，那么其他数据库配置将被忽略 |

```typescript
// 例
perfsee.mysql = {
  host: 'localhost',
  port: 3306,
  username: 'root',
  password: 'root',
  database: 'perfsee',
}
// 或
perfsee.mysql = {
  url: 'mysql://root:root@localhost:3306/perfsee',
}
```

更多 MySQL 的相关配置可以参考 [TypeORM 文档](https://typeorm.io/data-source-options)。

### Redis

所有的 Redis 配置均在 `perfsee.redis` 对象中设置。

| 配置名         | 类型   | 环境变量       | 默认值    | 说明           |
| -------------- | ------ | -------------- | --------- | -------------- |
| redis.host     | string | REDIS_HOST     | localhost | Redis 地址     |
| redis.port     | number | REDIS_PORT     | 6379      | Redis 端口     |
| redis.password | string | REDIS_PASSWORD |           | Redis 链接密码 |
| redis.db       | number | REDIS_DB       | 0         | Redis 数据库   |

```typescript
// 例
perfsee.redis = {
  host: 'localhost',
  port: 6379,
  password: '',
  db: 0,
}
```

更多 Redis 的相关配置可以参考 [ioredis 文档](https://github.com/luin/ioredis)。

### GraphQL

所有的 GraphQL 配置均在 `perfsee.graphql` 对象中设置。

| 配置名             | 类型              | 环境变量 | 默认值   | 说明                                                     |
| ------------------ | ----------------- | -------- | -------- | -------------------------------------------------------- |
| graphql.debug      | boolean           |          | true     | 是否启用 GraphQL 调试模式                                |
| graphql.playground | boolean \| object |          | true     | 是否启用 GraphQL playground                              |
| graphql.path       | string            |          | /graphql | GraphQL 端点服务的路径，默认通过 domain.com/graphql 访问 |

```
// 例
perfsee.graphql = {
  debug: false,
  playground: true,
}
```

更多 GraphQL 配置参考 [Apollo Server 文档](https://www.apollographql.com/docs/apollo-server/v2/api/apollo-server/#options)。

### 邮件

所有的邮件配置均在 `perfsee.email` 对象中设置。

| 配置名               | 类型    | 环境变量             | 默认值 | 说明                 |
| -------------------- | ------- | -------------------- | ------ | -------------------- |
| email.enable         | boolean | EMAIL_ENABLE         | false  | 是否启用邮件服务     |
| email.smtp.host      | string  | EMAIL_SMTP_HOST      |        | 邮件服务地址         |
| email.smtp.port      | number  | EMAIL_SMTP_PORT      |        | 邮件服务端口         |
| email.smtp.secure    | boolean | EMAIL_SMTP_SECURE    |        | 邮件服务是否启用 SSL |
| email.smtp.auth.user | string  | EMAIL_SMTP_AUTH_USER |        | 邮件服务用户名       |
| email.smtp.auth.pass | string  | EMAIL_SMTP_AUTH_PASS |        | 邮件服务密码         |
| email.from.name      | string  | EMAIL_FROM_NAME      |        | 邮件发送者名称       |
| email.from.address   | string  | EMAIL_FROM_ADDRESS   |        | 邮件发送者地址       |

```typescript
// 例
perfsee.email.enable = true
perfsee.email.smtp = {
  host: 'smtp.example.com',
  port: 465,
  secure: true,
  auth: {
    user: 'username',
    pass: 'password',
  },
}
perfsee.email.from = {
  name: 'Perfsee',
  address: 'no-reply@perfsee.com',
}
```

### 对象存储

所有的对象存储配置均在 `perfsee.objectStorage` 对象中设置。

| 配置名                 | 类型    | 环境变量 | 默认值 | 说明                                                                           |
| ---------------------- | ------- | -------- | ------ | ------------------------------------------------------------------------------ |
| objectStorage.enable   | boolean |          | false  | 是否启用对象存储，false 为仅使用本地临时存储                                   |
| objectStorage.artifact | object  |          | {}     | 用于存储分析报告的对象存储配置                                                 |
| objectStorage.jobLog   | object  |          |        | 用于存储分析日志文件的对象存储配置。留空则使用 objectStorage.artifact 存储日志 |

```typescript
// 例
perfsee.objectStorage.artifact = {
  provider: 'aws',
  region: 'eu-west-1',
  aws_access_key_id: '',
  aws_secret_access_key: '',
  // other aws storage perfsee...
}
// 如果不需要单独存储日志，可以不配置
perfsee.objectStorage.jobLog = {
  provider: 'aws',
  region: 'eu-west-1',
  aws_access_key_id: '',
  aws_secret_access_key: '',
  // other aws storage perfsee...
}
```

### Auth

所有的 Auth 配置均在 `perfsee.auth` 对象中设置。

| 配置名              | 类型    | 环境变量               | 默认值            | 说明                           |
| ------------------- | ------- | ---------------------- | ----------------- | ------------------------------ |
| auth.enableSignup   | boolean |                        | true              | 是否允许用户直接注册           |
| auth.enableOauth    | boolean |                        | false             | 是否允许用户使用第三方账号登录 |
| auth.oauthProviders | object  | DEFAULT_ADMIN_EMAIL    | admin@perfsee.com | 第三方登录配置                 |
| auth.admin          | object  | DEFAULT_ADMIN_PASSWORD |                   | 默认管理员账号配置             |

```typescript
// 例
perfsee.auth.enableSignup = true
perfsee.auth.enableOauth = true
perfsee.auth.oauthProviders = {
  github: {
    clientId: 'xxx',
    clientSecret: 'xxx',
    args: {
      scope: ['user'],
      response_type: 'user',
    },
  },
}
perfsee.auth.admin = {
  email: 'admin@perfsee.com',
  password: 'xxx',
}
```

### 项目

所有的项目配置均在 `perfsee.project` 对象中设置。

| 配置名                    | 类型    | 环境变量 | 默认值     | 说明                             |
| ------------------------- | ------- | -------- | ---------- | -------------------------------- |
| project.enableCreate      | boolean |          | true       | 是否允许用户直接创建项目         |
| project.enableDelete      | boolean |          | true       | 是否允许用户删除项目             |
| project.enableImport      | boolean |          | false      | 是否允许用户从第三方仓库导入项目 |
| project.externalProviders | Array   |          | ['github'] | 允许导入的第三方仓库类型         |

```typescript
// 例
perfsee.project = {
  enableCreate: true,
  enableDelete: true,
  enableImport: true,
  externalProviders: ['github'],
}
```

### 任务

所有的任务配置均在 `perfsee.job` 对象中设置。

| 配置名                  | 类型     | 环境变量 | 默认值    | 说明                               |
| ----------------------- | -------- | -------- | --------- | ---------------------------------- |
| job.pollingLimit        | number   |          | 10        | 每个实例最大同时处理的任务请求数量 |
| job.pollingQueueLimit   | number   |          | 10        | 每个实例最大任务请求等待队列长度   |
| job.pollingTimeoutSec   | number   |          | 5         | 任务请求超时时间                   |
| job.executionTimeoutSec | number   |          | 1800      | 任务执行超时时间                   |
| job.defaultZone         | string   |          | 'China'   | 默认任务区域                       |
| job.zones               | string[] |          | ['China'] | 任务区域列表                       |

```typescript
// 例
perfsee.job = {
  pollingLimit: 10,
  pollingQueueLimit: 10,
  pollingTimeoutSec: 5,
  executionTimeoutSec: 30 * 60,
}
```

### Runner

所有的 Runner 配置均在 `perfsee.runner` 对象中设置。

| 配置名                           | 类型    | 环境变量 | 默认值 | 说明                           |
| -------------------------------- | ------- | -------- | ------ | ------------------------------ |
| runner.validateRegistrationToken | boolean |          | true   | 是否验证 Runner 注册时的 Token |

```typescript
// 例
// 在开发模式中关闭 Runner 注册时的 Token 验证
perfsee.runner.validateRegistrationToken = perfsee.env !== 'development'
```

### 集成服务

所有的集成服务配置均在 `perfsee.integration` 对象中设置。

#### GitHub Bot

Github 集成配置，用于提供项目导入及 PR 检查等 Github Bot 功能。

```typescript
// 例
perfsee.integration.github = {
  enable: true,
  appName: 'perfsee',
  appId: 'xxx',
  privateKeyFile: '/path/to/bot/private.key',
}
```
