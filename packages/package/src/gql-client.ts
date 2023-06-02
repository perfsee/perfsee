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
import fetch from 'node-fetch'

export interface GraphQLQuery {
  id: string
  operationName: string
  definitionName: string
  query: string
}

export class GraphQLClient {
  static query({
    query,
    variables,
    token = process.env.PERFSEE_TOKEN,
    platform = process.env.PERFSEE_PLATFORM_HOST,
  }: {
    query: GraphQLQuery
    variables: any
    token?: string
    platform?: string
  }) {
    if (!token || !platform) {
      console.info(chalk.yellow('[perfsee] no platform or token, skip getting histories.'))
      return
    }

    const body: any = {
      variables,
      query: query.query,
    }

    if (query.operationName) {
      body.operationName = query.operationName
    }
    if (!body.query) {
      throw new Error('Query content could not be empty')
    }

    const context = {
      headers: {
        'content-type': 'application/json',
        'x-operation-name': query.operationName,
        'x-definition-name': query.definitionName,
        Authorization: `Bearer ${token}`,
      },
      responseType: 'json',
      body: JSON.stringify(body),
      method: 'POST',
    }

    const timeout = new Promise((_resolve, reject) => setTimeout(() => reject('Timeout'), 3000))

    return Promise.race([
      fetch(`${platform}/graphql`, context).then((response) => {
        if (response.status >= 400) {
          return response.text().then((text) => Promise.reject(text))
        } else {
          if (response.headers.get('content-type')?.includes('application/json')) {
            return response.json()
          } else {
            return response.text()
          }
        }
      }),
      timeout,
    ])
  }
}
