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

import { Controller, Get, Query, Res, HttpException, HttpStatus, Param } from '@nestjs/common'
import { Response } from 'express'
import FileType from 'file-type'

import { User } from '@perfsee/platform-server/db'
import { Logger } from '@perfsee/platform-server/logger'
import { ObjectStorage } from '@perfsee/platform-server/storage'
import { artifactKey } from '@perfsee/platform-server/utils'

import { Auth, CurrentUser } from '../auth'
import { ProjectService } from '../project/service'

@Controller('/v1')
export class FileController {
  constructor(private readonly storage: ObjectStorage, private readonly logger: Logger) {}

  @Auth()
  @Get('/file')
  async resource(@Res() res: Response, @Query('key') name: string) {
    if (!name) {
      throw new HttpException('Resource is required', HttpStatus.BAD_REQUEST)
    }

    try {
      const stream = await this.storage.getStream(name)
      res.set('cache-control', `public, max-age=6048000, immutable`)
      // fast pass and in the most case
      if (name.endsWith('.json')) {
        res.set('content-type', 'application/json')
        stream.pipe(res)
      } else {
        const contentWithType = await FileType.stream(stream)
        if (contentWithType.fileType) {
          res.set('content-type', contentWithType.fileType.mime)
        }
        contentWithType.pipe(res)
      }
    } catch (error) {
      this.logger.error('failed to get file', { name, error })
      throw new HttpException(`${name} not found`, HttpStatus.NOT_FOUND)
    }
  }
}

@Controller('/artifacts')
export class JobArtifactController {
  constructor(
    private readonly storage: ObjectStorage,
    private readonly logger: Logger,
    private readonly project: ProjectService,
  ) {}

  @Get('/:projectId/*')
  async getProjectArtifacts(
    @CurrentUser() user: User | undefined,
    @Res() res: Response,
    @Param() params: Record<string, string>,
  ) {
    const project = await this.project.getAccessibleProject(params.projectId, user)

    if (!project) {
      throw new HttpException(`Artifact file not found`, HttpStatus.NOT_FOUND)
    }

    const key = artifactKey(params.projectId, params[0])

    try {
      const stream = await this.storage.getStream(key)
      res.set('cache-control', 'public, max-age=6048000, immutable')
      // fast pass and in the most case
      if (key.endsWith('.json')) {
        res.set('content-type', 'application/json')
        stream.pipe(res)
      } else {
        const contentWithType = await FileType.stream(stream)
        if (contentWithType.fileType) {
          res.set('content-type', contentWithType.fileType.mime)
        }
        contentWithType.pipe(res)
      }
    } catch (error) {
      this.logger.error('failed to get project artifact', { key, error })
      throw new HttpException('Artifact file not found', HttpStatus.NOT_FOUND)
    }
  }
}
