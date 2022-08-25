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

import { isEqual } from 'lodash'
import {
  AuthenticationProvider,
  AuthenticationSession,
  EventEmitter,
  Uri,
  UriHandler,
  env,
  CancellationTokenSource,
  SecretStorage,
  AuthenticationProviderAuthenticationSessionsChangeEvent,
} from 'vscode'

import { getUser } from '../api/user'
import { ExtensionId } from '../constants'
import settings from '../settings'
import { CanceledError, createCancelablePromise, promiseFromEvent } from '../utils/async'
import Logger from '../utils/logger'

class UriEventHandler extends EventEmitter<Uri> implements UriHandler {
  handleUri(uri: Uri) {
    this.fire(uri)
  }
}

export const uriHandler = new UriEventHandler()

function parseQuery(uri: Uri) {
  return uri.query.split('&').reduce((prev: any, current) => {
    const [key, value] = [current.substring(0, current.indexOf('=')), current.substring(current.indexOf('=') + 1)]
    prev[key] = value
    return prev
  }, {})
}

const secretStorageKey = 'perfsee-session'

export class PerfseeAuthenticationProvider implements AuthenticationProvider {
  cancellationTokenSource: CancellationTokenSource | null = null
  private readonly sessionChangeEmitter = new EventEmitter<AuthenticationProviderAuthenticationSessionsChangeEvent>()

  constructor(private readonly secretStorage: SecretStorage) {}

  get onDidChangeSessions() {
    return this.sessionChangeEmitter.event
  }

  async getSessions(scopes?: string[]): Promise<ReadonlyArray<AuthenticationSession>> {
    // get current session
    const session = await this.getStoredSession()
    if (!session) return []

    return !scopes || isEqual(scopes, session.scopes) ? [session] : []
  }

  async createSession(scopes: string[]): Promise<AuthenticationSession> {
    if (this.cancellationTokenSource) {
      this.cancellationTokenSource.cancel()
      this.cancellationTokenSource = null
    }

    this.cancellationTokenSource = new CancellationTokenSource()

    return createCancelablePromise(async (cancellationToken) => {
      Logger.debug('[Authentication] login...')

      // login
      const callbackUri = await env.asExternalUri(Uri.parse(`${env.uriScheme}://${ExtensionId}/did-authenticate`))

      if (cancellationToken.isCancellationRequested) {
        throw new CanceledError()
      }
      await env.openExternal(
        // env.openExternal() has double encoded issue, calling with url string can solve this, see here: https://github.com/microsoft/vscode/issues/85930#issuecomment-821882174
        // @ts-expect-error
        new URL(
          `${settings.url}/oauth2/authorize?clientId=perfsee-vscode&returnUrl=${encodeURIComponent(
            callbackUri.toString(true),
          )}`,
          settings.url,
        ).href,
      )

      const result = await promiseFromEvent<Uri, Uri>(
        uriHandler.event,
        (value, resolve) => {
          if (value.path === '/did-authenticate') {
            resolve(value)
          }
        },
        cancellationToken,
      )

      const query = parseQuery(result)
      const accessToken = query['token']

      if (!accessToken) {
        throw new Error('The server did not return "sid" parameter.')
      }

      const user = await getUser(accessToken)

      if (!user) {
        throw new Error('User not found.')
      }

      const session: AuthenticationSession = {
        id: user.username,
        accessToken: accessToken,
        account: {
          id: user.username,
          label: user.username,
        },
        scopes: scopes,
      }

      Logger.debug('[Authentication] login success.', session)

      await this.storeSession(session)
      this.sessionChangeEmitter.fire({ added: [session], removed: [], changed: [] })
      return session
    }, this.cancellationTokenSource)
  }

  async removeSession(sessionId: string): Promise<void> {
    // logout
    const session = await this.getStoredSession()
    if (session?.id === sessionId) {
      await this.deleteStoredSession()
      this.sessionChangeEmitter.fire({ added: [], removed: [session], changed: [] })
    }
  }

  private async getStoredSession(): Promise<AuthenticationSession | null> {
    const sessionStr = await this.secretStorage.get(secretStorageKey)
    if (!sessionStr) return null
    return JSON.parse(sessionStr)
  }

  private async deleteStoredSession() {
    await this.secretStorage.delete(secretStorageKey)
  }

  private async storeSession(session: AuthenticationSession) {
    await this.secretStorage.store(secretStorageKey, JSON.stringify(session))
  }
}
