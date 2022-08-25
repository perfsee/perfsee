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

import { Command, Option } from 'clipanion'

import { ConfigManager } from '../config'
import { SIMPLE_URL_REGEXP } from '../constants'
import { PlatformClient } from '../platform-client'

export function validateHost(host: string) {
  if (!host) {
    throw new Error(
      'No remote host provided. You should specify it with `--url` option or env variable `PERFSEE_PLATFORM_HOST`.',
    )
  } else if (!SIMPLE_URL_REGEXP.test(host)) {
    throw new Error(`${host} is not a valid host url (example: https://example.org).`)
  }
}

export function validateRegistrationToken(token: string) {
  if (!token) {
    throw new Error(
      'No registration token provided. You should specify it with `--registration-token` option or env variable `PERFSEE_REGISTRATION_TOKEN`.',
    )
  }
}

export class RegisterCommand extends Command {
  static paths = [['register']]

  static usage = Command.Usage({
    description: 'register machine as perfsee job runner',
    examples: [['a basic example', '$0 register --url=https://example.org --registration-token=xxx']],
  })

  url = Option.String('--url', process.env.PERFSEE_PLATFORM_HOST ?? '', {
    description: 'remote host of your runner registered to',
  })
  registrationToken = Option.String('--registration-token', process.env.PERFSEE_REGISTRATION_TOKEN ?? '', {
    description: 'runner registration token',
  })
  name = Option.String('--name', { description: 'name of your runner' })
  force = Option.Boolean('--force', false, {
    description: 'force register as a new runner even if there is already one exists.',
  })

  async execute() {
    validateHost(this.url)
    validateRegistrationToken(this.registrationToken)

    const configManager = new ConfigManager()
    const config = configManager.load()

    const client = new PlatformClient(config)

    configManager.patch(
      {
        name: this.name,
        server: {
          url: this.url,
        },
      },
      false,
    )

    // already have runner registered
    if (!this.force && config.server.token && (await client.verifyRunner())) {
      return 0
    }

    const res = await client.registerRunner(config.name, this.registrationToken)
    if (!res) {
      return 1
    }

    configManager.patch({
      server: {
        token: res.token,
      },
      runner: res.set,
    })
  }
}
