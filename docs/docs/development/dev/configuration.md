---
sidebar_position: 3
---

# Configuration

There are three main sources of Perfsee runtime configuration: configuration files, environment variables and database, they will be loaded in order, and the later loaded data will override the previous configuration.

1. Load the default configuration in `./packages/platform-server/src/config/default.ts`
2. Load the custom configuration in `./packages/platform-server/src/perfsee.config.ts`
3. Load environment variables, according to the definition in `packages/platform-server/src/perfsee.env.ts` to override the configuration
4. Load the configuration in the ApplicationSetting table of the database

## Modify configuration

### Add configuration item

If you need to add a configuration item, you should declare its type in `./packages/platform-server/src/config/def.ts` and add detailed configuration instructions and usage examples.

```typescript
// example
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

### Modify configuration file

The configuration file is located at `./packages/platform-server/src/perfsee.config.ts`, you can modify the configuration according to your needs.

:::caution
The modification of the configuration file takes effect after the service is restarted
:::

```typescript
perfsee.newConfig = {
  field: 'new value',
}
```

### Modify configuration in Database

We provide an [admin interface](https://perfsee.com/admin) where you can modify the configuration stored in the database, and the modified configuration will be saved to the database and take effect immediately.

## Configuration item description

### Basic configuration

| Config name | Type    | Environment variable    | Default value | Description                                                                                           |
| ----------- | ------- | ----------------------- | ------------- | ----------------------------------------------------------------------------------------------------- |
| secret      | string  | PERFSEE_SERVER_SECRET   |               | Encryption key used to encrypt cookies, tokens, etc.                                                  |
| https       | boolean | PERFSEE_SERVER_HTTPS    | false         | Whether to enable https                                                                               |
| host        | string  | PERFSEE_SERVER_HOST     | localhost     | The domain name where the server is deployed                                                          |
| port        | number  | PERFSEE_SERVER_PORT     | 3000          | The port where the server is listening                                                                |
| path        | string  | PERFSEE_SERVER_SUB_PATH | ''(empty)     | The subpath where the server is deployed, if not deployed in the root path, this item needs to be set |

```typescript
// example
perfsee.https = true
perfsee.host = 'perfsee.com'
```

### MySQL

All MySQL configurations are set in the `perfsee.mysql` object.

| Config name    | Type   | Environment variable | Default value | Description                                                                                    |
| -------------- | ------ | -------------------- | ------------- | ---------------------------------------------------------------------------------------------- |
| mysql.host     | string | MYSQL_HOST           | localhost     | Database address                                                                               |
| mysql.port     | number | MYSQL_PORT           | 3306          | Database port                                                                                  |
| mysql.username | string | MYSQL_USERNAME       | root          | Database username                                                                              |
| mysql.password | string | MYSQL_PASSWORD       | root          | Database password                                                                              |
| mysql.database | string | MYSQL_DATABASE       | perfsee       | Database name                                                                                  |
| mysql.url      | string | MYSQL_URL            |               | Database connection address, if this item is set, other database configuration will be ignored |

```typescript
// example
perfsee.mysql = {
  host: 'localhost',
  port: 3306,
  username: 'root',
  password: 'root',
  database: 'perfsee',
}
// or
perfsee.mysql = {
  url: 'mysql://root:root@localhost:3306/perfsee',
}
```

More MySQL-related configurations can be found in [TypeORM documentation](https://typeorm.io/data-source-options).

### Redis

All Redis configurations are set in the `perfsee.redis` object.

| Config name    | Type   | Environment variable | Default value | Description               |
| -------------- | ------ | -------------------- | ------------- | ------------------------- |
| redis.host     | string | REDIS_HOST           | localhost     | Redis address             |
| redis.port     | number | REDIS_PORT           | 6379          | Redis port                |
| redis.password | string | REDIS_PASSWORD       |               | Redis connection password |
| redis.db       | number | REDIS_DB             | 0             | Redis database            |

```typescript
// example
perfsee.redis = {
  host: 'localhost',
  port: 6379,
  password: '',
  db: 0,
}
```

More Redis-related configurations can be found in [ioredis documentation](https://github.com/luin/ioredis).

### GraphQL

All GraphQL configurations are set in the `perfsee.graphql` object.

| Config name        | Type              | Environment variable | Default value | Description                                            |
| ------------------ | ----------------- | -------------------- | ------------- | ------------------------------------------------------ |
| graphql.debug      | boolean           |                      | true          | Whether to enable GraphQL debug mode                   |
| graphql.playground | boolean \| object |                      | true          | Whether to enable GraphQL playground                   |
| graphql.path       | string            |                      | /graphql      | The path where the GraphQL endpoint service is located |

```typescript
// example
perfsee.graphql = {
  debug: false,
  playground: true,
}
```

More GraphQL configurations can be found in [Apollo Server documentation](https://www.apollographql.com/docs/apollo-server/v2/api/apollo-server/#options).

### Email

All email configurations are set in the `perfsee.email` object.

| Config name          | Type    | Environment variable | Default value | Description                             |
| -------------------- | ------- | -------------------- | ------------- | --------------------------------------- |
| email.enable         | boolean | EMAIL_ENABLE         | false         | Whether to enable email service         |
| email.smtp.host      | string  | EMAIL_SMTP_HOST      |               | Email service address                   |
| email.smtp.port      | number  | EMAIL_SMTP_PORT      |               | Email service port                      |
| email.smtp.secure    | boolean | EMAIL_SMTP_SECURE    |               | Whether to enable SSL for email service |
| email.smtp.auth.user | string  | EMAIL_SMTP_AUTH_USER |               | Email service username                  |
| email.smtp.auth.pass | string  | EMAIL_SMTP_AUTH_PASS |               | Email service password                  |
| email.from.name      | string  | EMAIL_FROM_NAME      |               | Email sender name                       |
| email.from.address   | string  | EMAIL_FROM_ADDRESS   |               | Email sender address                    |

```typescript
// example
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

### Object Storage

All object storage configurations are set in the `perfsee.objectStorage` object.

| Config name            | Type    | Environment variable | Default value | Description                                                                                                             |
| ---------------------- | ------- | -------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------- |
| objectStorage.enable   | boolean |                      | false         | Whether to enable object storage, false means only use local temporary storage                                          |
| objectStorage.artifact | object  |                      | {}            | Object storage configuration for storing analysis reports                                                               |
| objectStorage.jobLog   | object  |                      |               | Object storage configuration for storing analysis log files. Leave it blank to use objectStorage.artifact to store logs |

```typescript
// example
perfsee.objectStorage.artifact = {
  provider: 'aws',
  region: 'eu-west-1',
  aws_access_key_id: '',
  aws_secret_access_key: '',
  aws_s3_bucket: '',
  aws_s3_endpoint: '',
  // other aws storage perfsee...
}
// If you don't need to store logs separately, you can leave it empty
perfsee.objectStorage.jobLog = {
  provider: 'aws',
  region: 'eu-west-1',
  aws_access_key_id: '',
  aws_secret_access_key: '',
  aws_s3_bucket: '',
  aws_s3_endpoint: '',
  // other aws storage perfsee...
}
```

### Auth

All Auth configurations are set in the `perfsee.auth` object.

| Config name         | Type    | Environment variable | Default value | Description                                                |
| ------------------- | ------- | -------------------- | ------------- | ---------------------------------------------------------- |
| auth.enableSignup   | boolean |                      | true          | Whether to allow users to register directly                |
| auth.enableOauth    | boolean |                      | false         | Whether to allow users to log in with third-party accounts |
| auth.oauthProviders | object  |                      |               | Third-party login configuration                            |
| auth.admin          | object  |                      |               | Default administrator account configuration                |

```typescript
// example
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

### Project

All project configurations are set in the `perfsee.project` object.

| Config name               | Type    | Environment variable | Default value | Description                                                             |
| ------------------------- | ------- | -------------------- | ------------- | ----------------------------------------------------------------------- |
| project.enableCreate      | boolean |                      | true          | Whether to allow users to create projects directly                      |
| project.enableDelete      | boolean |                      | true          | Whether to allow users to delete projects                               |
| project.enableImport      | boolean |                      | false         | Whether to allow users to import projects from third-party repositories |
| project.externalProviders | Array   |                      | ['github']    | Allowed third-party repository types                                    |

```typescript
// example
perfsee.project = {
  enableCreate: true,
  enableDelete: true,
  enableImport: true,
  externalProviders: ['github'],
}
```

### Job

All job configurations are set in the `perfsee.job` object.

| Config name             | Type     | Environment variable | Default value | Description                                                         |
| ----------------------- | -------- | -------------------- | ------------- | ------------------------------------------------------------------- |
| job.pollingLimit        | number   |                      | 10            | Maximum number of tasks processed by each instance at the same time |
| job.pollingQueueLimit   | number   |                      | 10            | Maximum length of the task request waiting queue for each instance  |
| job.pollingTimeoutSec   | number   |                      | 5             | Task request timeout time                                           |
| job.executionTimeoutSec | number   |                      | 1800          | Task execution timeout time                                         |
| job.defaultZone         | string   |                      | 'China'       | Default task region                                                 |
| job.zones               | string[] |                      | ['China']     | All task available regions                                          |

```typescript
// example
perfsee.job = {
  pollingLimit: 10,
  pollingQueueLimit: 10,
  pollingTimeoutSec: 5,
  executionTimeoutSec: 1800,
  defaultZone: 'China',
  zones: ['China'],
}
```

### Runner

All Runner configurations are set in the `perfsee.runner` object.

| Config name                      | Type    | Environment variable | Default value | Description                                           |
| -------------------------------- | ------- | -------------------- | ------------- | ----------------------------------------------------- |
| runner.validateRegistrationToken | boolean |                      | true          | Whether to verify the Token when registering a Runner |

```typescript
// example
// Disable Token verification when registering a Runner in development mode
perfsee.runner.validateRegistrationToken = perfsee.env !== 'development'
```

### Integration

All integration configurations are set in the `perfsee.integration` object.

#### GitHub Bot

Github integration configurations, used to provide Github Bot functions such as project import and PR check.

```typescript
// example
perfsee.integration.github = {
  enable: true,
  appName: 'perfsee',
  appId: 'xxx',
  privateKeyFile: '/path/to/bot/private.key',
}
```
