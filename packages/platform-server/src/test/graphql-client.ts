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

import { omit, isNil, isObject } from 'lodash'
import request from 'supertest'

import { RequestOptions, GraphQLQuery, RequestBody, QueryOptions, MutationOptions, QueryResponse } from '../graphql'

import { TestingClient } from './client'

export function filterEmptyValue(obj: any) {
  const newObj = {}
  Object.entries(obj).forEach(([key, value]) => {
    if (isNil(value)) {
      return
    }
    if (isObject(value)) {
      newObj[key] = filterEmptyValue(value)
      return
    }
    newObj[key] = value
  })

  return newObj
}

export class GraphQLTestingClient extends TestingClient {
  protected endpoint = '/graphql'
  constructor(protected appServer = perfsee.baseUrl) {
    super(appServer)
    this.presetHeaders['content-type'] = 'application/json'
  }

  query<Q extends GraphQLQuery>(options: QueryOptions<Q>) {
    return this.graphQLRequest<Q, QueryResponse<Q>>(options)
  }

  mutate<Q extends GraphQLQuery>(options: MutationOptions<Q>) {
    return this.graphQLRequest<Q, QueryResponse<Q>>({ query: options.mutation, ...omit(options, 'mutation') } as any)
  }

  private graphQLRequest<Q extends GraphQLQuery, Response>({
    query,
    variables,
    keepNilVariables,
    context,
  }: RequestOptions<Q>): Promise<Response> {
    const body = this.getRequestBody(query, variables, keepNilVariables)
    if (!body.query) {
      throw new Error('Query content could not be empty')
    }

    const headers = {
      ...this.presetHeaders,
      ...context?.headers,
      'x-operation-name': query.operationName,
      'x-definition-name': query.definitionName,
    }

    return request(this.appServer)
      .post(this.endpoint)
      .set(headers)
      .send(JSON.stringify(body))
      .then(({ body }) => {
        const { data, errors } = body
        if (data) {
          return Promise.resolve(data)
        }
        if (errors) {
          return Promise.reject(new Error(errors?.[0]?.message ?? JSON.stringify(errors)))
        }
      })
  }

  private getRequestBody(document: GraphQLQuery, variables: any = {}, keepNilVariables = true): RequestBody {
    const body: RequestBody = {
      variables: keepNilVariables ? variables : filterEmptyValue(variables),
      query: document.query,
    }

    if (document.operationName) {
      body.operationName = document.operationName
    }

    return body
  }
}
