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

import { Injectable } from '@nestjs/common'

import { MetricsProvider } from './providers'

@Injectable()
export class Metric {
  readonly visit = this.metricsProvider.meter('website.visit', ['source'])
  readonly gqlRequest = this.metricsProvider.counter('graphql.requests', ['operationName'])
  readonly gqlRequestTime = this.metricsProvider.timer('graphql.requests.time', ['operationName'])
  readonly gqlRequestSuccess = this.metricsProvider.counter('graphql.requests.success', ['operationName'])
  readonly gqlRequestFail = this.metricsProvider.counter('graphql.requests.fail', ['operationName'])
  readonly openApiCall = this.metricsProvider.meter('api.open.call')
  readonly openApiCallThrottled = this.metricsProvider.counter('api.open.call.throttled')

  readonly jobCreate = this.metricsProvider.meter('jobs.create', ['jobType'])
  readonly jobSuccess = this.metricsProvider.meter('jobs.success', ['jobType'])
  readonly jobFail = this.metricsProvider.meter('jobs.fail', ['jobType'])
  readonly jobPendingTime = this.metricsProvider.time('jobs.pending.time', ['jobType'])
  readonly jobRequestTimer = this.metricsProvider.timer('jobs.requests.time', ['jobType'])
  readonly jobExecutionTime = this.metricsProvider.time('jobs.execution.time', ['jobType'])

  readonly bundleUpload = this.metricsProvider.meter('features.bundle.upload', ['toolkit', 'appVersion', 'nodeVersion'])
  readonly bundleUploadFail = this.metricsProvider.counter('features.bundle.upload.fail', [
    'toolkit',
    'appVersion',
    'nodeVersion',
  ])
  readonly bundleComplete = this.metricsProvider.counter('features.bundle.complete')
  readonly bundleFail = this.metricsProvider.counter('features.bundle.fail')

  readonly packageUpload = this.metricsProvider.meter('features.package.upload', ['appVersion', 'nodeVersion'])
  readonly packageUploadFail = this.metricsProvider.counter('features.packages.upload.fail', [
    'appVersion',
    'nodeVersion',
  ])
  readonly packageComplete = this.metricsProvider.counter('feature.package.complete')
  readonly packageFaile = this.metricsProvider.counter('feature.package.fail')

  readonly snapshotCreate = this.metricsProvider.meter('features.snapshot.create')
  readonly snapshotCreateFail = this.metricsProvider.counter('features.snapshot.create.fail')
  readonly snapshotComplete = this.metricsProvider.counter('features.snapshot.complete')
  readonly snapshotCompleteByCron = this.metricsProvider.counter('features.snapshot.complete.by.cron')
  readonly snapshotFail = this.metricsProvider.counter('features.lab.fail')
  readonly snapshotReportCreate = this.metricsProvider.counter('features.lab.report.create')
  readonly snapshotReportComplete = this.metricsProvider.counter('features.lab.report.complete')
  readonly snapshotReportFail = this.metricsProvider.counter('features.lab.report.fail')

  readonly blockRelease = this.metricsProvider.meter('features.release.block', ['jobType'])
  readonly elapseRelease = this.metricsProvider.meter('features.release.block.elapse')

  readonly totalProject = this.metricsProvider.store('projects.total')
  readonly activeProject = this.metricsProvider.store('projects.active', ['period'])
  readonly newProject = this.metricsProvider.counter('projects.new')

  readonly totalGroup = this.metricsProvider.store('groups.total')
  readonly newGroup = this.metricsProvider.counter('groups.new')

  readonly notificationSend = this.metricsProvider.meter('features.notification.send', ['type'])

  readonly serviceStatus = this.metricsProvider.store('status.services.status', ['service'])
  readonly runnerOnline = this.metricsProvider.store('status.runners.online', ['idc'])
  readonly runnerOffline = this.metricsProvider.store('status.runners.offline', ['idc'])

  readonly cronJobStatus = this.metricsProvider.store('status.cron', ['name'])

  constructor(@MetricsProvider private readonly metricsProvider: MetricsProvider) {}
}
