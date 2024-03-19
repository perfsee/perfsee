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

import { Controller, Get, Res } from '@nestjs/common'
import { ApiExcludeController } from '@nestjs/swagger'
import { Response } from 'express'

import { staticPath } from '@perfsee/shared/routes'

import { GithubService } from './service'

@ApiExcludeController()
@Controller('/github')
export class GithubController {
  constructor(private readonly service: GithubService) {}

  @Get('/new')
  new(@Res() res: Response) {
    return res.redirect(this.service.getInstallUrl())
  }

  @Get('/callback')
  callback(@Res() res: Response) {
    return res.redirect(staticPath.importGithub)
  }

  /* TODO: github webhook */
}
