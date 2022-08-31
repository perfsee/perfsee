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

import chalk from 'chalk'
import { Command, Option } from 'clipanion'

import { Client } from '../client'
import { getCurrentCommit } from '../git'

export class TakeSnapshotCommand extends Command {
  static paths = [['take-snapshot']]

  static usage = Command.Usage({
    description: `Take a snapshot of the project.`,
    details: `Take a snapshot for all pages of the project.
    
This command requires the project id from \`-p, --project\` and the access token from \`--token\` or environment variable \`PERFSEE_TOKEN\`, you can create the token from \`https://perfsee.com/access-token\`.

You can filter the pages by appending page names to the command.`,
    examples: [
      [`Take a snapshot for all pages`, `$0 take-snapshot -p perfsee`],
      [`Take a snapshot for \`Home Page\` and \`User Page\``, `$0 take-snapshot -p perfsee "Home Page" "User Page"`],
    ],
  })

  pages = Option.Rest({ required: 0 })

  project = Option.String(`-p,--project`, {
    description: 'The project ID on PerfSee platform.',
  })

  hash = Option.String(`--hash`, {
    description: 'The commit hash associated with the snapshot, defaults to read from git.',
  })

  envs = Option.Array(`--env`, {
    description: 'Filter environments to be included in the snapshot. defaults to include all environments.',
  })

  profiles = Option.Array(`--profile`, {
    description: 'Filter profiles to be included in the snapshot. defaults to include all profiles.',
  })

  title = Option.String(`--title`, { description: 'The title of the snapshot.' })

  accessToken = Option.String(`--token`, {
    description:
      'Authentication token used for calling Perfsee api. will also read from env `PERFSEE_TOKEN` if not provided.',
  })

  server = Option.String(`--server`, { hidden: true })

  async execute() {
    const accessToken = this.accessToken || process.env.PERFSEE_TOKEN

    if (!this.project) {
      this.context.stderr.write(chalk.red('Project is required!\n'))
      this.context.stdout.write(this.cli.usage(this, { detailed: true }))
      return 1
    }

    if (!accessToken) {
      this.context.stderr.write(chalk.red('Access token is required!\n'))
      this.context.stdout.write(this.cli.usage(this, { detailed: true }))
      return 1
    }

    this.context.stdout.write('[Perfsee] Taking snapshot...\n')

    let hash = this.hash ?? (await getCurrentCommit())
    if (!hash) {
      hash = undefined
    } else if (!/^[0-9a-f]{40}$/.test(hash)) {
      throw new Error(`Invalid hash: "${hash}"`)
    }

    const client = new Client({
      accessToken: accessToken,
      host: this.server || process.env.PERFSEE_PLATFORM_HOST || 'https://perfsee.com',
    })

    this.context.stdout.write(`Project: ${this.project}\n`)

    const settings = await client.projectSettings(this.project)

    const pageIds = this.pages.map((pageName) => {
      const page = settings.pages.find((p) => p.name === pageName)
      if (!page) {
        throw new Error(`Page "${pageName}" not found`)
      }
      return page.id
    })
    this.context.stdout.write(`Pages: ${pageIds}\n`)

    const envIds = this.envs?.map((envName) => {
      const env = settings.environments.find((e) => e.name === envName)
      if (!env) {
        throw new Error(`Environment "${envName}" not found`)
      }
      return env.id
    })
    this.context.stdout.write(`Envs: ${envIds}\n`)

    const profileIds = this.profiles?.map((profileName) => {
      const profile = settings.profiles.find((e) => e.name === profileName)
      if (!profile) {
        throw new Error(`Profile "${profileName}" not found`)
      }
      return profile.id
    })
    this.context.stdout.write(`Profiles: ${profileIds}\n`)

    const snapshot = await client.takeSnapshot(this.project, pageIds, profileIds, envIds, this.title, hash)

    this.context.stdout.write(`Created snapshot #${snapshot.id}\n`)

    return Promise.resolve()
  }
}
