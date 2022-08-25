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

import { NotificationProvider } from '../type'

import { EmailNotificationProvider } from './email/provider'

export * from './email/provider'

export const PROVIDERS = {
  email: EmailNotificationProvider,
}

@Injectable()
export class NotificationProviderFactory implements OnModuleInit {
  private readonly providers = {} as Record<string, NotificationProvider>

  constructor(private readonly moduleRef: ModuleRef) {}

  async onModuleInit() {
    for (const name in PROVIDERS) {
      this.providers[name] = await this.moduleRef.create(PROVIDERS[name])
    }
  }

  getProviders(): Record<string, NotificationProvider> {
    return this.providers
  }
}
