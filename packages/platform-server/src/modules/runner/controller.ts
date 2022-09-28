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

import { Body, Controller, Headers, HttpCode, HttpStatus, Post } from '@nestjs/common'

import { RegisterRunnerParams, RegisterRunnerResponse } from '@perfsee/server-common'

import { RunnerService } from './service'

@Controller('/runners')
export class RunnerController {
  constructor(private readonly service: RunnerService) {}

  @Post('/register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() body: RegisterRunnerParams): Promise<RegisterRunnerResponse> {
    return this.service.register(body)
  }

  @Post('/verify')
  @HttpCode(HttpStatus.NO_CONTENT)
  async verify(@Headers('x-runner-token') token: string) {
    await this.service.authenticateRunner(token)
  }
}
