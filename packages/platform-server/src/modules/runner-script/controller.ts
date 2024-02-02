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
import { createHash } from 'crypto'

import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Query,
  Res,
} from '@nestjs/common'
import { Response } from 'express'
import { v4 as uuid } from 'uuid'

import { RunnerScript, User } from '@perfsee/platform-server/db'
import { ObjectStorage } from '@perfsee/platform-server/storage'
import { JobType } from '@perfsee/server-common'

import { ApplicationSettingService } from '../application-setting'
import { CurrentUser } from '../auth'
import { RunnerService } from '../runner/service'

import { RunnerScriptService } from './service'

@Controller('/runners/scripts')
export class RunnerScriptController {
  constructor(
    private readonly service: RunnerScriptService,
    private readonly storage: ObjectStorage,
    private readonly setting: ApplicationSettingService,
    private readonly runner: RunnerService,
  ) {}

  @Post('/:type/:version')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Param('type') type: string,
    @Param('version') version: string,
    @Body() file: Buffer,
    @Query('desc') desc?: string,
    @Query('enable') enable?: string,
    @Headers('x-registration-token') registrationToken?: string,
    @Headers('x-checksum') checksum?: string,
    @CurrentUser() user?: User,
  ) {
    if (!user?.isAdmin) {
      if (!registrationToken) {
        throw new ForbiddenException('Registration token is required')
      }
      if (!(await this.setting.validateRegistrationToken(registrationToken))) {
        throw new ForbiddenException('Invalid registration token')
      }
    }
    const sha256 = createHash('sha256').update(file).digest('base64')

    if (!checksum || checksum !== sha256) {
      throw new ForbiddenException('Failed to validate script checksum')
    }

    const jobType = JobType[type] ?? type
    const storageKey = `runner-script/${uuid()}.tar`
    await this.storage.upload(storageKey, file)
    try {
      await this.service.create({
        jobType,
        size: file.byteLength,
        version: version,
        storageKey: storageKey,
        enable: enable === 'true',
        description: desc,
        sha256,
      })
    } catch (e) {
      throw new BadRequestException(e)
    }
  }

  @Get('/:type/:version/download')
  async get(
    @Param('type') type: string,
    @Res() res: Response,
    @Param('version') version: string,
    @Headers('x-runner-token') token?: string,
    @CurrentUser() user?: User,
  ) {
    if (!user) {
      if (!token) {
        throw new ForbiddenException('Runner token is required')
      }
      await this.runner.authenticateRunner(token)
    }

    const jobType = JobType[type] ?? type

    const script = await RunnerScript.findOne({
      where: {
        version: version,
        jobType,
      },
    })

    if (!script) {
      throw new NotFoundException('Script not found')
    }

    const stream = await this.storage.getStream(script.storageKey)
    res.set('content-type', 'application/tar+gzip')
    res.set('Digest', 'sha-256=' + script.sha256)
    stream.pipe(res)
  }

  @Get('/:type/activated')
  async getActivated(
    @Param('type') type: string,
    @Res() res: Response,
    @Headers('x-runner-token') token?: string,
    @CurrentUser() user?: User,
  ) {
    if (!user) {
      if (!token) {
        throw new ForbiddenException('Runner token is required')
      }
      await this.runner.authenticateRunner(token)
    }

    const jobType = JobType[type] ?? type
    const activated = await this.service.getActivated(jobType)
    if (activated) {
      res.status(HttpStatus.OK)
      res.send(activated)
    } else {
      res.status(HttpStatus.NO_CONTENT)
      res.send('No activated runner script')
    }
  }
}
