import { FrameInfo } from './lib/profile'

export interface PerfseeFlameChartFrameInfo extends FrameInfo {
  bundleName?: string
  origin?: string
}

export interface PerfseeFlameChartData {
  startTime: number
  endTime: number
  frames: PerfseeFlameChartFrameInfo[]
  samples: number[][]
  weights: number[]
}

export type RequestTiming = 'Blocked' | 'DNS' | 'Connect' | 'Send' | 'Wait' | 'SSL' | 'Receive'

export type TimingSchema = {
  name: string
  timestamp: number
  duration: number
  [key: string]: string | number
}

export interface CallFrame {
  functionName: string
  scriptId: string
  url?: string
  lineNumber: number
  columnNumber: number
}
export interface StackTrack {
  description?: string
  parent?: StackTrack
  parentId?: {
    id: string
    debuggerId?: string
  }
  callFrames: CallFrame[]
}

export interface Initiator {
  type: 'parser' | 'script' | 'preload' | 'SignedExchange' | 'preflight' | 'other'
  url?: string
  lineNumber?: number
  columnNumber?: number
  requestId?: string
  stack?: StackTrack
}

export type NetworkRequest = {
  index: number
  url: string
  method: string
  status: string
  statusCode: number
  protocol: string
  startTime: number
  endTime: number
  priority: string
  type: string
  transferSize: number
  size: number
  timing: number
  timings: { name: RequestTiming; value: number }[]
  responseHeader: Record<string, string | number>
  requestHeader: Record<string, string | number>
  initiator: Initiator
  requestId: string
}

export interface TracehouseTask {
  kind: string
  startTime: number
  endTime: number
  children: TracehouseTask[]
  event: { name: string; cat: string }
}
