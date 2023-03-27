import { NetworkRequest } from '../types'
import { NonStackProfile } from './non-stack-profile'
import { Frame, FrameInfo } from './profile'

export interface NetworkFrameInfo extends FrameInfo {
  info?: NetworkRequest
}

export class NetworkFrame extends Frame {
  info?: NetworkRequest

  public constructor(info: NetworkFrameInfo) {
    super(info)
    this.info = info.info
  }
}

export class NetworkProfile extends NonStackProfile {
  constructor(totalWeight: number, maxValue: number, minValue: number) {
    super(totalWeight, maxValue, minValue)
  }

  appendNetworkRequestRecord(url: string, startTime: number, endTime: number, info?: NetworkRequest) {
    var frame = new NetworkFrame({
      key: url,
      name: url,
      file: url,
      info,
    })
    frame.addToSelfWeight(endTime - startTime)
    frame.addToTotalWeight(endTime - startTime)
    this.append(frame, startTime, endTime)
  }
}
