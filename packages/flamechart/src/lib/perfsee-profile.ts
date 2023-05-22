import { PerfseeFlameChartFrameInfo } from '../types'
import { Frame, FrameInfo, StackListProfileBuilder } from './profile'
import { KeyedSet } from './utils'

export interface PerfseeFrameInfo extends FrameInfo {
  info?: PerfseeFlameChartFrameInfo
}

export class PerfseeFrame extends Frame {
  info?: PerfseeFlameChartFrameInfo

  public constructor(info: PerfseeFlameChartFrameInfo) {
    super(info)
    this.info = info
  }

  static getOrInsert(set: KeyedSet<Frame>, info: PerfseeFlameChartFrameInfo) {
    return set.getOrInsert(new PerfseeFrame(info))
  }
}

export class PerfseeProfile extends StackListProfileBuilder {
  appendSample(stack: PerfseeFrame[], weight: number) {
    this.appendSampleWithWeight(stack, weight)
  }
}
