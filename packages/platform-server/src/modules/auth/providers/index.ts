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

import { Injectable, OnModuleInit } from '@nestjs/common'
import { ModuleRef } from '@nestjs/core'

import { Config } from '@perfsee/platform-server/config'
import { ExternalAccount } from '@perfsee/shared'

import { GithubOAuthProvider } from './github'
import { OAuthProvider } from './provider'

export * from './provider'

export const PROVIDERS: Record<ExternalAccount, new (...args: any[]) => OAuthProvider> = {
  github: GithubOAuthProvider,
}

@Injectable()
export class OAuthProviderFactory implements OnModuleInit {
  private providers = {} as Record<ExternalAccount, OAuthProvider>

  constructor(private readonly moduleRef: ModuleRef, private readonly config: Config) {}

  async onModuleInit() {
    for (const name in PROVIDERS) {
      if (this.config.auth.oauthProviders[name]) {
        this.providers[name] = await this.moduleRef.create(PROVIDERS[name])
      }
    }
  }

  getProvider(name: ExternalAccount): OAuthProvider | undefined {
    return this.providers[name]
  }
}
