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

import { Cli, Builtins } from 'clipanion'

import { TakeSnapshotCommand } from './take-snapshot'

export function runCli() {
  const cli = new Cli({
    binaryLabel: 'Perfsee sdk',
    binaryName: `perfsee`,
    binaryVersion: `0.0.0`,
  })

  cli.register(Builtins.VersionCommand)
  cli.register(Builtins.HelpCommand)
  cli.register(Builtins.DefinitionsCommand)

  cli.register(TakeSnapshotCommand)

  cli
    .run(process.argv.slice(2), {
      stdin: process.stdin,
      stdout: process.stdout,
      stderr: process.stderr,
    })
    .then((code) => {
      process.exit(code)
    })
    .catch((e) => {
      console.error(e)
      process.exit(1)
    })
}
