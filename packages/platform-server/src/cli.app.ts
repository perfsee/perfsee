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

import './prelude'
import { Cli } from 'clipanion'

import { DBModule, DBService } from '@perfsee/platform-server/db'

import { createApp } from './app.entry'
import { Context, DemoScript } from './scripts'

createApp()
  .then(async ({ app }) => {
    return {
      app,
      db: await app.select(DBModule).resolve<DBService>(DBService),
    }
  })
  .then(({ app, db }) => {
    const cli = new Cli<Context>({
      binaryLabel: 'Perfsee scripts',
      binaryName: 'script',
      binaryVersion: `0.0.0`,
    })

    cli.register(DemoScript)
    cli
      .run(process.argv.slice(2), {
        stdin: process.stdin,
        stdout: process.stdout,
        stderr: process.stderr,
        app,
        db,
      })
      .then((code) => {
        process.exit(code)
      })
      .catch((e) => {
        console.error(e)
        process.exit(1)
      })
  })
  .catch((e) => {
    console.error(e)
  })
