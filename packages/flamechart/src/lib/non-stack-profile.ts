import { CallTreeNode, Frame, Profile } from './profile'

export class NonStackTreeNode extends CallTreeNode {
  constructor(
    readonly frame: Frame,
    readonly parent: CallTreeNode | null,
    public startTime: number,
    public endTime: number,
  ) {
    super(frame, parent)
  }
}

export class NonStackProfile extends Profile {
  protected calltreeRoot: NonStackTreeNode

  constructor(totalWeight: number, maxValue: number, minValue: number) {
    super(totalWeight, maxValue, minValue)
    this.calltreeRoot = new NonStackTreeNode(Frame.root, null, 0, totalWeight)
  }

  override forEachCall(
    openFrame: (node: CallTreeNode, value: number) => void,
    closeFrame: (node: CallTreeNode, value: number) => void,
  ) {
    function getAllEvents(
      node: NonStackTreeNode,
      events: { type: 'open' | 'close'; node: NonStackTreeNode; time: number }[] = [],
    ) {
      if (node.frame.key !== Frame.root.key) {
        events.push({ type: 'open', time: node.startTime, node: node })
        events.push({ type: 'close', time: node.endTime, node: node })
      }

      node.children.forEach(function (child) {
        getAllEvents(child as NonStackTreeNode, events)
      })

      return events
    }
    const events = getAllEvents(this.calltreeRoot)
    events
      .sort((a, b) => a.time - b.time)
      .forEach((event) => {
        if (event.type === 'open') {
          openFrame(event.node, event.time)
        } else if (event.type === 'close') {
          closeFrame(event.node, event.time)
        }
      })
  }

  append(frame: Frame, startTime: number, endTime: number) {
    const node = new NonStackTreeNode(frame, this.calltreeRoot, startTime, endTime)
    node.addToSelfWeight(endTime - startTime)
    node.addToTotalWeight(endTime - startTime)
    this.calltreeRoot.children.push(node)
    this.frames.getOrInsert(frame)
  }
}
