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

import { inspect } from 'util'

import { ExecutionResult } from 'graphql'
import { omit, merge } from 'lodash'

import {
  MutationOptions,
  QueryOptions,
  QueryResponse,
  RequestBody,
  RequestOptions,
  Variables,
  GraphQLQuery,
} from '../types/graphql'

import fetch from './fetch'
import Logger from './logger'

const endpoint = '/graphql'
const presetHeaders: { [key: string]: string } = {
  'content-type': 'application/json',
}

export function query<Q extends GraphQLQuery>(options: QueryOptions<Q>) {
  return request<Q, QueryResponse<Q>>(options)
}

export function mutate<Q extends GraphQLQuery>(options: MutationOptions<Q>) {
  // @ts-expect-error
  return request<Q, QueryResponse<Q>>({ query: options.mutation, ...omit(options, 'mutation') })
}

export class ApiError extends Error {
  constructor(public statusCode: number, public message: string, public data: any) {
    super('API ERROR ' + statusCode)
  }
}

export async function request<Q extends GraphQLQuery, Response>({
  query,
  variables,
  context = {},
}: RequestOptions<Q>): Promise<Response> {
  const body = getRequestBody(query, variables)
  if (!body.query) {
    throw new Error('Query content could not be empty')
  }

  merge(context, {
    headers: {
      ...presetHeaders,
      'x-operation-name': query.operationName,
      'x-definition-name': query.definitionName,
    },
    responseType: 'json',
    body: body.form ?? JSON.stringify(body),
  })

  const res = await fetch(endpoint, {
    ...context,
    method: 'POST',
  })

  if (res.status >= 400) {
    const message = res.statusText
    let data = null

    try {
      data = await res.json()
    } catch (error) {
      try {
        data = await res.text()
      } catch (error) {
        data = res.statusText
      }
    }

    throw new ApiError(res.status, message, data)
  } else {
    const json = (await res.json()) as ExecutionResult<Response>
    Logger.debug(`[graphql] ${inspect(json)}`)
    if (json.errors) {
      let message
      try {
        message = json.errors.map((error: any) => error.message).join(', ')
      } catch (error) {
        message = JSON.stringify(json.errors)
      }
      throw new ApiError(res.status, message, json.errors)
    } else {
      return json.data!
    }
  }
}

function getRequestBody(document: GraphQLQuery, variables: Variables = {}): RequestBody {
  const body: RequestBody = {
    variables: variables,
    query: document.query,
  }

  if (document.operationName) {
    body.operationName = document.operationName
  }

  return body
}
