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

import { PerfseeConfig } from '@perfsee/platform-server/config'

export interface ExternalAccountUser {
  username: string
  email?: string
  avatarUrl: string
}

export abstract class OAuthProvider {
  protected abstract globalConfig: PerfseeConfig
  get redirectUri() {
    return this.globalConfig.baseUrl + '/oauth2/callback'
  }
  abstract getAuthUrl(state?: string): string
  abstract getToken(code: string): Promise<string>
  abstract getUser(token: string): Promise<ExternalAccountUser>
}
