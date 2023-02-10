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

import { E2eJobWorker } from './e2e-worker'
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
      metrics,
      failedReason,
    } = await this.audit()

    if (failedReason) {
      this.updateJob({
        type: JobType.LabAnalyze,
        payload: {
          snapshotReport: {
            id: payload.reportId,
            screencastStorageKey,
            status: SnapshotStatus.Failed,
            failedReason: failedReason,
          },
        },
      })
    } else {
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
            status: SnapshotStatus.Completed,
            performanceScore: metrics![LighthouseScoreMetric.Performance],
            metrics,
          },
        },
      })
    }
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
      },
    })
  }
}

export class E2EJobWorker extends E2eJobWorker {
  protected async before() {
    if (!this.payload.e2eScript) {
      throw new Error('E2E script cannot be empty')
    }

    this.updateJob({
      type: JobType.E2EAnalyze,
      payload: {
        snapshotReport: {
          id: this.payload.reportId,
          status: SnapshotStatus.Running,
        },
      },
    })
    await super.before()
  }

  protected async work() {
    const payload = this.payload
    const { lighthouseStorageKey, screencastStorageKey, failedReason, metrics } = await this.audit()

    if (failedReason) {
      this.updateJob({
        type: JobType.E2EAnalyze,
        payload: {
          snapshotReport: {
            id: payload.reportId,
            screencastStorageKey,
            status: SnapshotStatus.Failed,
            failedReason: failedReason,
          },
        },
      })
    } else {
      this.updateJob({
        type: JobType.E2EAnalyze,
        payload: {
          snapshotReport: {
            id: payload.reportId,
            lighthouseStorageKey,
            screencastStorageKey,
            status: SnapshotStatus.Completed,
            performanceScore: metrics![LighthouseScoreMetric.Performance],
            metrics,
          },
        },
      })
    }
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
