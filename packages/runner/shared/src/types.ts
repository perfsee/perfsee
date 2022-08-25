import { JobInfo, JobType, UpdateJobEvent } from '@perfsee/server-common'
import { JobLog } from '@perfsee/shared'

export interface ServerConfig {
  url: string
  token: string
  timeout: number
}

type RecursivePartial<T> = T extends object ? { [P in keyof T]?: RecursivePartial<T[P]> } : T
export interface RunnerConfig {
  version: string
  name: string
  server: ServerConfig
  runner: {
    jobType: JobType
    checkInterval: number
    timeout: number
    concurrency: number
  }
}

export type PartialRunnerConfig = RecursivePartial<RunnerConfig>

export type ParentMessage =
  | {
      type: 'start'
      payload: WorkerData
    }
  | {
      type: 'shutdown'
      payload?: undefined
    }
  | {
      type: 'raise'
      payload: string
    }

export type WorkerMessage =
  | {
      type: 'alive'
      payload?: undefined
    }
  | {
      type: 'start'
      payload?: undefined
    }
  | {
      type: 'log'
      payload: JobLog
    }
  | {
      type: 'event'
      payload: UpdateJobEvent
    }
  | {
      type: 'end'
      payload?: undefined
    }
  | {
      type: 'raised'
      payload?: undefined
    }

export type WorkerData<Payload = any> = {
  job: JobInfo<Payload>
  server: ServerConfig
}
