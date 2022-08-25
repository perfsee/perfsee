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

import { hostname } from 'os'

import { v4 as uuid } from 'uuid'

import { getCli } from './commands'

const cli = getCli()
const availableCommands = cli.definitions()
const command = process.argv[2]

if (
  command &&
  availableCommands.find((def) => {
    def.path.substring(cli.binaryName.length) === command
  })
) {
  void cli.runExit(process.argv)
} else {
  void (async () => {
    const exitCode = await cli.run(['register', '--name', `${hostname()}-${uuid()}`])

    if (exitCode === 0) {
      await cli.runExit(['start'])
    } else {
      process.exit(exitCode)
    }
  })()
}
