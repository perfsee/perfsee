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

import { merge } from 'lodash'
import { RequestInit } from 'node-fetch'
import { AuthenticationSession } from 'vscode'

import { QueryOptions, GraphQLQuery, MutationOptions } from '../types/graphql'
import fetch from '../utils/fetch'
import { query, mutate, ApiError } from '../utils/graphql'

import { getUser } from './user'

export class UnauthorizedError extends Error {
  constructor() {
    super('Unauthorized')
  }
}

export class ApiClient {
  get accessToken() {
    return this.authenticationSession.accessToken
  }

  get authorizationHeader() {
    return this.accessToken
      ? {
          Authorization: 'Bearer ' + this.accessToken,
        }
      : {}
  }

  constructor(private readonly authenticationSession: AuthenticationSession) {}

  async fetch(url: string, init?: RequestInit) {
    return fetch(url, merge({ headers: this.authorizationHeader }, init))
  }

  async query<Q extends GraphQLQuery>(options: QueryOptions<Q>) {
    return query<Q>(merge({ context: { headers: this.authorizationHeader } }, options)).catch(async (reason) => {
      if (this.isUnauthorizedError(reason)) {
        await this.checkAuthorizationAndThrowError()
      }

      throw reason
    })
  }

  async mutate<Q extends GraphQLQuery>(options: MutationOptions<Q>) {
    return mutate<Q>(merge({ context: { headers: this.authorizationHeader } }, options)).catch(async (reason) => {
      if (this.isUnauthorizedError(reason)) {
        await this.checkAuthorizationAndThrowError()
      }

      throw reason
    })
  }

  private isUnauthorizedError(error: any) {
    return (
      error instanceof ApiError &&
      (error.message.includes('Unauthorized user') || error.message.includes('Forbidden resource'))
    )
  }

  private async checkAuthorizationAndThrowError() {
    if (!(await this.checkAuthorization())) {
      throw new UnauthorizedError()
    }
  }

  /**
   * Check if the user is still online.
   */
  private async checkAuthorization() {
    const token = this.accessToken
    if (!token) return false
    try {
      const user = await getUser(token)
      return !!user
    } catch (err) {
      return false
    }
  }
}
