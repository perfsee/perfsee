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

import { Cli } from 'clipanion'

import { BuildCommand } from './build'
import { BundleCommand } from './bundle'
import { CodegenCommand } from './codegen'
import { DevCommand } from './dev'
import { ExampleCommand } from './example'
import { ExtractCommand } from './extract'
import { GenerateLicenseCommand } from './generate-license'
import { InitCommand } from './init'
import { UpdateWorkspaceCommand } from './update-workspace'
import { VscodeExtensionCommand } from './vscode'

const cli = new Cli({
  binaryLabel: 'Perfsee dev',
  binaryName: `bin`,
  binaryVersion: `0.0.0`,
})

cli.register(BuildCommand)
cli.register(BundleCommand)
cli.register(DevCommand)
cli.register(ExampleCommand)
cli.register(InitCommand)
cli.register(CodegenCommand)
cli.register(GenerateLicenseCommand)
cli.register(VscodeExtensionCommand)
cli.register(UpdateWorkspaceCommand)
cli.register(ExtractCommand)

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
