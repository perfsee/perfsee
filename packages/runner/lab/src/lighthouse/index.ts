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

import { JobType, SnapshotStatus } from '@perfsee/server-common'
import { LighthouseScoreMetric } from '@perfsee/shared'

import { LabWithFlowJobWorker } from './flow-worker'
import { LighthouseJobWorker } from './lighthouse-worker'
import { LabPingJobWorker } from './ping-worker'

export class LabJobWorker extends LighthouseJobWorker {
  protected async before() {
    this.updateJob({
      type: JobType.LabAnalyze,
      payload: {
        snapshotReport: {
          id: this.payload.reportId,
          status: SnapshotStatus.Running,
        },
        jobId: this.job.jobId,
      },
    })
    await super.before()
  }

  protected async work() {
    const payload = this.payload
    const {
      lighthouseStorageKey,
      screencastStorageKey,
      jsCoverageStorageKey,
      traceEventsStorageKey,
      reactProfileStorageKey,
      traceDataStorageKey,
      requestsStorageKey,
      metrics,
      failedReason,
    } = await this.audit()

    this.updateJob({
      type: JobType.LabAnalyze,
      payload: {
        snapshotReport: {
          id: payload.reportId,
          lighthouseStorageKey,
          screencastStorageKey,
          jsCoverageStorageKey,
          traceEventsStorageKey,
          reactProfileStorageKey,
          traceDataStorageKey,
          requestsStorageKey,
          status: failedReason ? SnapshotStatus.Failed : SnapshotStatus.Completed,
          performanceScore: metrics?.[LighthouseScoreMetric.Performance],
          metrics,
          failedReason: failedReason,
        },
        jobId: this.job.jobId,
      },
    })
  }

  protected onError(e: Error) {
    const payload = this.payload

    this.updateJob({
      type: JobType.LabAnalyze,
      payload: {
        snapshotReport: {
          id: payload.reportId,
          status: SnapshotStatus.Failed,
          failedReason: e.message,
        },
        jobId: this.job.jobId,
      },
    })
  }
}

export class PingJobWorker extends LabPingJobWorker {
  protected async before() {
    this.updateJob({
      type: JobType.LabPing,
      payload: {
        key: this.payload.key,
        status: 'running',
      },
    })
    await super.before()
  }

  protected async work() {
    const { status } = await this.audit()

    this.updateJob({
      type: JobType.LabPing,
      payload: {
        key: this.payload.key,
        status,
      },
    })
  }

  protected onError(_e: Error) {
    this.updateJob({
      type: JobType.LabPing,
      payload: {
        key: this.payload.key,
        status: 'failed',
      },
    })
  }
}

export class UserFlowJobWorker extends LabWithFlowJobWorker {
  protected async before() {
    this.updateJob({
      type: JobType.LabAnalyze,
      payload: {
        snapshotReport: {
          id: this.payload.reportId,
          status: SnapshotStatus.Running,
        },
        jobId: this.job.jobId,
      },
    })
    await super.before()
  }

  protected async work() {
    const payload = this.payload
    const {
      steps: userflowResults,
      lighthouseStorageKey,
      screencastStorageKey,
      jsCoverageStorageKey,
      traceEventsStorageKey,
      reactProfileStorageKey,
      traceDataStorageKey,
      requestsStorageKey,
      metrics,
      failedReason,
      stepName,
      stepId,
    } = await this.audit()

    this.updateJob({
      type: JobType.E2EAnalyze,
      payload: {
        snapshotReport: {
          lighthouseStorageKey,
          screencastStorageKey,
          jsCoverageStorageKey,
          traceEventsStorageKey,
          reactProfileStorageKey,
          traceDataStorageKey,
          requestsStorageKey,
          metrics,
          failedReason,
          stepId,
          stepName,
          status: failedReason ? SnapshotStatus.Failed : SnapshotStatus.Completed,
          performanceScore: metrics?.[LighthouseScoreMetric.Performance],
          id: payload.reportId,
        },
        flowReport: userflowResults.map((r) => {
          const {
            lighthouseStorageKey,
            screencastStorageKey,
            jsCoverageStorageKey,
            traceEventsStorageKey,
            reactProfileStorageKey,
            traceDataStorageKey,
            requestsStorageKey,
            metrics,
            failedReason,
            stepName,
            stepId,
          } = r

          return {
            id: payload.reportId,
            lighthouseStorageKey,
            screencastStorageKey,
            jsCoverageStorageKey,
            traceEventsStorageKey,
            reactProfileStorageKey,
            traceDataStorageKey,
            requestsStorageKey,
            status: SnapshotStatus.Completed, // always completed here
            stepName,
            stepId,
            performanceScore: metrics?.[LighthouseScoreMetric.Performance],
            metrics,
            failedReason,
          }
        }),
        jobId: this.job.jobId,
      },
    })
  }

  protected onError(e: Error) {
    const payload = this.payload

    this.updateJob({
      type: JobType.E2EAnalyze,
      payload: {
        snapshotReport: {
          id: payload.reportId,
          status: SnapshotStatus.Failed,
          failedReason: e.message,
        },
        flowReport: [],
        jobId: this.job.jobId,
      },
    })
  }
}
