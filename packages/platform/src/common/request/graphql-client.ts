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

import { Injectable } from '@sigi/di'
import { ExecutionResult, GraphQLError } from 'graphql'
import { omit, merge } from 'lodash'
import { defer, throwError } from 'rxjs'
import { tap, map, catchError } from 'rxjs/operators'

import { LoggerFactory } from '@perfsee/platform/common'

import { RxFetch } from './rx-fetch'
import { RequestOptions, GraphQLQuery, RequestBody, QueryOptions, MutationOptions, QueryResponse } from './types'
import { appendFormData, filterEmptyValue } from './utils'

@Injectable()
export class GraphQLClient {
  protected host: string = SERVER
  protected endpoint = '/graphql'
  protected get url() {
    return this.host + this.endpoint
  }
  protected presetHeaders: { [key: string]: string } = {
    'content-type': 'application/json',
  }

  constructor(private readonly fetch: RxFetch, private readonly logger: LoggerFactory) {}

  query<Q extends GraphQLQuery>(options: QueryOptions<Q>) {
    return this.request<Q, QueryResponse<Q>>(options)
  }

  mutate<Q extends GraphQLQuery>(options: MutationOptions<Q>) {
    // @ts-expect-error
    return this.request<Q, QueryResponse<Q>>({ query: options.mutation, ...omit(options, 'mutation') })
  }

  private request<Q extends GraphQLQuery, Response>({
    query,
    variables,
    context = {},
    keepNilVariables,
    files,
  }: RequestOptions<Q>) {
    const performanceOrDate = window.performance || Date
    const now = performanceOrDate.now()

    const body = this.getRequestBody(query, variables, keepNilVariables, files)
    if (!body.query) {
      throw new Error('Query content could not be empty')
    }

    const rawBody = body.form ?? JSON.stringify(body)

    merge(context, {
      headers: {
        ...this.presetHeaders,
        'x-operation-name': query.operationName,
        'x-definition-name': query.definitionName,
      },
      responseType: 'json',
      body: rawBody,
    })

    return defer(() => {
      if (__IS_SERVER__) {
        const expressHttpContext = require('express-http-context')

        context = {
          ...context,
          headers: {
            ...context.headers,
            cookie: expressHttpContext.get('cookie'),
            Authorization: expressHttpContext.get('Authorization'),
          },
        }
      }

      return this.fetch.post<ExecutionResult<Response>>(this.url, context).pipe(
        tap({
          next: () => {
            const responseTime = performanceOrDate.now() - now
            this.reportPerformance(body, responseTime)
          },
        }),
        map(({ data, errors }) => {
          if (errors && errors.length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-throw-literal
            throw errors
          }

          if (!data) {
            throw new Error('Empty response content')
          }

          return data
        }),
        catchError((e: any) => {
          this.reportError(body, Array.isArray(e) ? e : [e])
          return throwError(() => e)
        }),
      )
    })
  }

  private reportPerformance(body: RequestBody, time: number) {
    this.logger.info('graphql', {
      time,
      operationName: body.operationName,
      body: omit(body, 'form'),
    })
  }

  private reportError(body: RequestBody, errors: ReadonlyArray<GraphQLError>) {
    errors.forEach((error) => {
      this.logger.error('graphql error', error, { body: omit(body, 'form') })
    })
  }

  private getRequestBody(
    document: GraphQLQuery,
    variables: any = {},
    keepNilVariables = true,
    files: File[] = [],
  ): RequestBody {
    const body: RequestBody = {
      variables: keepNilVariables ? variables : filterEmptyValue(variables),
      query: document.query,
    }

    if (document.operationName) {
      body.operationName = document.operationName
    }

    if (files.length) {
      appendFormData(body, files)
    }

    return body
  }
}
