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

import { execSync } from 'child_process'

import { watch } from 'chokidar'

import { getPackage, logger } from '../utils'

const schemaPackage = getPackage('@perfsee/schema')
const serverSchema = schemaPackage.relative('src/server-schema.gql')
const clientSchema = schemaPackage.relative('src/graphql/**/*.{gql,graphql}')

export async function generateGraphqlSchema() {
  execSync('yarn gql-gen', {
    stdio: 'pipe',
  })
  logger.info('Graphql schema generated')
}

export function watchGraphqlSchema() {
  const watcher = watch([serverSchema, clientSchema], {
    ignoreInitial: true,
  })

  const close = () => {
    watcher.close().catch(() => {})
  }

  const generate = () => {
    generateGraphqlSchema().catch((e) => {
      console.error('Failed to generate graphql schema')
      console.error(e)
    })
  }

  return new Promise<() => void>((resolve, reject) => {
    watcher
      .on('ready', () => {
        generateGraphqlSchema()
          .then(() => resolve(close))
          .catch((e) => {
            close()
            reject(e)
          })
      })
      .on('add', generate)
      .on('change', generate)
      .on('unlink', generate)
  })
}
