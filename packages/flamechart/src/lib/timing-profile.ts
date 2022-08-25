import { TimingSchema } from "../types"
import { NonStackProfile } from "./non-stack-profile"
import { Frame, FrameInfo } from "./profile"
import { KeyedSet } from "./utils"

export interface TimingFrameInfo extends FrameInfo {
  info?: TimingSchema
}

export class TimingFrame extends Frame {
  info?: TimingSchema

  public constructor(info: TimingFrameInfo) {
    super(info)
    this.info = info.info
  }

  static getOrInsert(set: KeyedSet<Frame>, info: TimingFrameInfo) {
    return set.getOrInsert(new TimingFrame(info))
  }
}

export class TimingProfile extends NonStackProfile {
  constructor(totalWeight: number, maxValue: number, minValue: number) {
    super(totalWeight, maxValue, minValue)
  }

  appendTiming(name: string, startTime: number, endTime: number, info?: TimingSchema) {
    var frame = new TimingFrame({
      key: name,
      name,
      info
    })
    frame.addToSelfWeight(endTime - startTime)
    frame.addToTotalWeight(endTime - startTime)
    this.append(frame, startTime, endTime)
  }
}
