const env = process.env

//
// ###############################################################
// ##              Perfsee configuration settings               ##
// ###############################################################
// override any configuration here and it will be merged
// Settings merge order
//   1. load `./config/default.ts` for all default settings
//   3. apply `perfsee.config.ts` patches (this file)
//   2. load environment variables (`.env` if provided, and from system)
//   4. apply `perfsee.env.ts` patches
//   5. load database (eg, `db.auth_enable_signup` will cover `perfsee.auth.enableSignup`)
// any changes in this file won't take effect before server restarted
// ###############################################################
// ##                    1. General settings                    ##
// ###############################################################
// # the secret key used to sign the any encrypted data including cookies, tokens.
// perfsee.secret = 'secret'

// # Whether the server is hosted on a ssl enabled domain
// perfsee.https = true

// # where the server get deployed.
// perfsee.host = 'perfsee.com'

// # which port the server will listen on
// perfsee.port = 3000

// # subpath where the server get deployed if there is.
// perfsee.path = ''

// # whether enable apollo graphql driver debug mode
// perfsee.graphql.debug = false

// ###############################################################
// ##                    2. Database settings                   ##
// ###############################################################
// # the database connection options
// perfsee.mysql = {
//   host: 'localhost',
//   port: 3306,
//   username: 'root',
//   password: 'root',
//   database: 'perfsee',
// }
//
// # or if you prefer use database url
// perfsee.mysql = {
//   url: 'mysql://root:root@localhost:3306/perfsee',
// }

// ###############################################################
// ##                    3. Redis settings                      ##
// ###############################################################
// perfsee.redis = {
//   host: 'localhost',
//   port: 6379,
//   password: '',
//   db: 0,
// }

// ###############################################################
// ##                    4. Email settings                      ##
// ###############################################################
perfsee.email.enable = true
// perfsee.email.smtp = {
//   host: 'smtp.example.com',
//   port: 465,
//   secure: true,
//   auth: {
//     user: 'username',
//     pass: 'password',
//   }
// }
// perfsee.email.from = {
//   name: 'Perfsee',
//   address: 'no-reply@example.com',
// }

// ###############################################################
// ##                    5. Storage settings                    ##
// ###############################################################
// # object storage settings
// # all artifacts and logs will be stored on instance disk if not set,
// # and the files can not be shared cross instances.
// perfsee.objectStorage.artifact = {
//   provider: 'aws',
//   region: 'eu-west-1',
//   aws_access_key_id: '',
//   aws_secret_access_key: '',
//   aws_s3_bucket: '',
//   aws_s3_endpoint: '',
//   other aws storage perfsee...
// }
// # object storage that used to put all job logs
// # will fallback to `perfsee.objectStorage.artifact` if not set
// perfsee.objectStorage.jobLog = {
//   provider: 'aws',
//   region: 'eu-west-1',
//   aws_access_key_id: '',
//   aws_secret_access_key: '',
//   aws_s3_bucket: '',
//   aws_s3_endpoint: '',
//   other aws storage perfsee...
// }

// ###############################################################
// ##                    6. Auth settings                       ##
// ###############################################################
// # whether allow user to signup with email directly
perfsee.auth.enableSignup = true

// # whether allow user to signup by oauth providers
perfsee.auth.enableOauth = true
perfsee.auth.oauthProviders = {
  github: {
    clientId: env.GITHUB_OAUTH_CLIENT_ID!,
    clientSecret: env.GITHUB_OAUTH_CLIENT_SECRET!,
    args: {
      scope: ['user'],
      response_type: 'user',
    },
  },
}

// # config the default admin user login credential
// perfsee.auth.admin = {
//   email: 'root@perfsee.com,
//   password: 'root',
// }

// ###############################################################
// ##                   7. Project settings                     ##
// ###############################################################
// # whether allow user to create project directly
// perfsee.project.enableCreate = true

// # whether allow user to delete project
// perfsee.project.enableDelete = true

// # whether allow user to create project by importing from git hosts like github or gitlab
perfsee.project.enableImport = true
perfsee.project.externalProviders = ['github']

// ###############################################################
// ##                   8. Job settings                         ##
// ###############################################################
// # maximum job pulling requests per instance can handle concurrently
// perfsee.job.pollingLimit = 10

// # maximum job pulling requests in queue per instance, if reach polling limit
// perfsee.job.pollingQueueLimit = 10

// # timeout for job pulling requests
// perfsee.job.pollingTimeoutSec = 5

// # timeout for job execution
// perfsee.job.executionTimeoutSec = 30 * 60

// eg: China:5:3,US:3:1
perfsee.job.lab.distributedConfig =
  env.DISTRIBUTED_CONFIG?.split(',').reduce((config, zoneConfig) => {
    const [zone, count = 5, runs = 1] = zoneConfig.split(':')
    return { ...config, [zone]: { count: Number(count), runs: Number(runs) } }
  }, {}) || {}

perfsee.job.lab.variabilityThreshold = Number(env.VARIABILITY_THRESHOLD) || Infinity

// ###############################################################
// ##                  9. Runner settings                       ##
// ###############################################################
// # whether validation runner registration token while registering new runners
perfsee.runner.validateRegistrationToken = perfsee.env !== 'development'

// ###############################################################
// ##                  10. integration settings                 ##
// ###############################################################
// # github service for supporting project imports and PR checks
// # required if `project.externalProviders` includes `github`
perfsee.integration.github = {
  enable: true,
  appName: env.GITHUB_APPNAME,
  appId: env.GITHUB_APPID,
  privateKeyFile: env.GITHUB_APP_PRIVATE_KEY_FILE,
}
