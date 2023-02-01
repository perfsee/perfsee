// ###############################################################
// ##              Perfsee configuration settings               ##
// ###############################################################
// This map is used to read and override runtime configuration from environment variables.
// only if listed environment variables set, the corresponding configuration in `perfsee.config.{ts,js}` will be overridden.
// you can also specify environment variables in `.env` file, and they will be loaded automatically.
perfsee.ENV_MAP = {
  NODE_ENV: ['env'],
  PERFSEE_SERVER_SECRET: 'secret',
  PERFSEE_SERVER_HTTPS: ['https', 'boolean'],
  PERFSEE_SERVER_HOST: 'host',
  PERFSEE_SERVER_PORT: ['port', 'int'],
  PERFSEE_SERVER_SUB_PATH: 'path',
  PERFSEE_PUBLIC_PATH: 'publicPath',
  MYSQL_URL: 'mysql.url',
  MYSQL_PORT: ['mysql.port', 'int'],
  MYSQL_HOST: 'mysql.host',
  MYSQL_USERNAME: 'mysql.username',
  MYSQL_PASSWORD: 'mysql.password',
  MYSQL_DB: 'mysql.database',
  REDIS_HOST: 'redis.host',
  REDIS_PORT: ['redis.port', 'int'],
  REDIS_PASSWORD: 'redis.password',
  REDIS_DB: ['redis.db', 'int'],
  DEFAULT_ADMIN_EMAIL: ['auth.admin.email'],
  DEFAULT_ADMIN_PASSWORD: ['auth.admin.password'],
  EMAIL_SMTP_HOST: 'email.smtp.host',
  EMAIL_SMTP_PORT: ['email.smtp.port', 'int'],
  EMAIL_SMTP_SECURE: ['email.smtp.secure', 'boolean'],
  EMAIL_SMTP_AUTH_USER: 'email.smtp.auth.user',
  EMAIL_SMTP_AUTH_PASSWORD: 'email.smtp.auth.password',
  EMAIL_FROM_NAME: 'email.from.name',
  EMAIL_FROM_ADDRESS: 'email.from.address',
  GITHUB_OAUTH_CLIENT_ID: 'auth.oauthProviders.github.clientId',
  GITHUB_OAUTH_CLIENT_SECRET: 'auth.oauthProviders.github.clientSecret',
}
