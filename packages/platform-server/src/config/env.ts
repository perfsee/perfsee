import { set } from 'lodash'

import { parseEnvValue } from './def'

for (const env in perfsee.ENV_MAP) {
  const config = perfsee.ENV_MAP[env]
  const [path, value] =
    typeof config === 'string' ? [config, process.env[env]] : [config[0], parseEnvValue(process.env[env], config[1])]

  if (typeof value !== 'undefined') {
    set(globalThis.perfsee, path, process.env[env])
  }
}
