import { TracehouseTask } from "../types"
import { NonStackProfile, NonStackTreeNode } from "./non-stack-profile"
import { CallTreeNode, CallTreeNodeAttribute, Frame, FrameInfo } from "./profile"
import { assert, KeyedSet, lastOf } from "./utils"

export interface TracehouseFrameInfo extends FrameInfo {
  kind: string
}

export class TracehouseFrame extends Frame {
  kind: string

  public constructor(info: TracehouseFrameInfo) {
    super(info)
    this.kind = info.kind
  }

  static getOrInsert(set: KeyedSet<Frame>, info: TracehouseFrameInfo) {
    return set.getOrInsert(new TracehouseFrame(info))
  }
}

export interface TracehouseGroupedFrameInfo extends FrameInfo {
  level: number
  groupName: string
}

export class TracehouseGroupedFrame extends Frame {
  level: number
  groupName: string

  public constructor(info: TracehouseGroupedFrameInfo) {
    super(info)
    this.level = info.level
    this.groupName = info.groupName
  }

  static getOrInsert(set: KeyedSet<Frame>, info: TracehouseFrameInfo) {
    return set.getOrInsert(new TracehouseFrame(info))
  }
}

export class TracehouseProfile extends NonStackProfile {
  constructor(totalWeight: number, maxValue: number, minValue: number) {
    super(totalWeight, maxValue, minValue)
  }

  appendTracehouseTask(task: TracehouseTask) {
    var frame = new TracehouseFrame({
      key: task.event.name,
      name: task.event.name,
      file: `[${task.kind}] ` + task.event.cat,
      kind: task.kind
    })
    frame.addToSelfWeight(task.endTime - task.startTime)
    frame.addToTotalWeight(task.endTime - task.startTime)
    this.append(frame, task.startTime, task.endTime)
  }

  groupBy(cb: (kind: string) => { level: number, groupName: string }) {
    const frames: (TracehouseGroupedFrame | undefined)[] = []
    const groups: [{startTime: number, endTime: number}[], number][] = []
    const openFrame = (node: CallTreeNode, value: number) => {
      const group = cb((node.frame as TracehouseFrame).kind)
  
      let frame
      if (frames[group.level] === undefined) {
        frame = new TracehouseGroupedFrame({
          key: group.groupName,
          name: group.groupName,
          file: group.groupName,
          level: group.level,
          groupName: group.groupName
        })
        frames[group.level] = frame
      } else {
        frame = frames[group.level]
      }
      
      const groupNode = {startTime: value, endTime: Infinity}
      if (groups[group.level] === undefined) {
        groups[group.level] = [[groupNode], 1]
      } else {
        if (groups[group.level][1] > 0) {
          groups[group.level][1]++
        }else {
          groups[group.level][0].push(groupNode)
          groups[group.level][1] = 1
        }
      }
    }
  
    const closeFrame = (node: CallTreeNode, value: number) => {
      const group = cb((node.frame as TracehouseFrame).kind)

      assert(groups[group.level] !== undefined)
      assert(groups[group.level][1] > 0)
  
      groups[group.level][1]--
  
      if (groups[group.level][1] == 0) {
        const node = lastOf(groups[group.level][0])!;
        assert(node.endTime === Infinity)
        node.endTime = value
        frames[group.level]!.addToSelfWeight(value - node.startTime)
        frames[group.level]!.addToTotalWeight(value - node.startTime)
      }
    }

    this.forEachCall(openFrame, closeFrame)

    this.calltreeRoot.children = groups.flatMap(([group], i) => {
      return group.map((item) => {
        const node = new NonStackTreeNode(frames[i]!, this.calltreeRoot, item.startTime, item.endTime)
        node.addToSelfWeight(item.endTime - item.startTime)
        node.addToTotalWeight(item.endTime - item.startTime)
        if (i == 0 && node.getTotalWeight() > 50000) {
          node.attributes = CallTreeNodeAttribute.LONG_TASK
        }
        return node
      })
    })
    this.frames = new KeyedSet<Frame>()
    for (const frame of frames) {
      if (frame) {
        this.frames.getOrInsert(frame)
      }
    }
  }
}
