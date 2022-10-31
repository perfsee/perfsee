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

import path from 'path'

import { Module } from '@nestjs/common'
import { HttpAdapterHost } from '@nestjs/core'
import { Application, static as expressStatic } from 'express'

import { Config } from './config'

@Module({
  imports: [],
})
export class StaticModule {
  constructor(private readonly config: Config, private readonly adapterHost: HttpAdapterHost) {}

  onModuleInit() {
    const assets = (...n: string[]) => path.join(process.cwd(), 'assets', ...n)
    const basePath = this.config.path

    const app = this.adapterHost.httpAdapter.getInstance() as Application

    app.use(
      basePath + '/docs',
      expressStatic(assets('docs'), {
        redirect: false,
        extensions: ['html'],
      }),
    )
    app.get([basePath + '/docs', basePath + '/docs/*'], (_req, res) => {
      res.sendFile(assets('docs', 'index.html'))
    })

    app.use(basePath, expressStatic(assets('platform')))
    app.get('*', (_req, res) => {
      res.sendFile(assets('platform', 'index.html'))
    })
  }
}
