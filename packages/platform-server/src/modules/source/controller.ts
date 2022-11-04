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

import { Controller } from '@nestjs/common'

import { OnEvent } from '@perfsee/platform-server/event'
import { Logger } from '@perfsee/platform-server/logger'
import { JobType, SourceAnalyzeJobResult } from '@perfsee/server-common'

import { SourceService } from './service'

@Controller()
export class SourceController {
  constructor(private readonly logger: Logger, private readonly service: SourceService) {}

  @OnEvent(`${JobType.SourceAnalyze}.update`)
  async onReceiveAnalyzeResult({
    projectId,
    reportId,
    artifactIds,
    diagnostics,
    flameChartStorageKey,
    sourceCoverageStorageKey,
  }: SourceAnalyzeJobResult) {
    this.logger.log('receive deployment analyze result')
    await this.service.updateReport(reportId, artifactIds, flameChartStorageKey, sourceCoverageStorageKey)
    await this.service.saveSourceIssues(projectId, reportId, diagnostics)
  }
}
