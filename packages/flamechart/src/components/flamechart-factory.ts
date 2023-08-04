import { buildFlamechart, Flamechart, NodeProcessor, RootFilter } from '../lib/flamechart'
import { NonStackTreeNode } from '../lib/non-stack-profile'
import { Frame, Profile } from '../lib/profile'
import { ReactFrame, ReactProfile } from '../lib/react-devtool/react-profile'
import { TimingFrame } from '../lib/timing-profile'
import { TracehouseGroupedFrame } from '../lib/tracehouse-profile'
import { memoizeByReference } from '../lib/utils'

export const createGetColorBucketForFrame = memoizeByReference((frameToColorBucket: Map<number | string, number>) => {
  return (frame: Frame): number => {
    return frameToColorBucket.get(frame.key) ?? 0
  }
})

export const getFrameToColorBucket = memoizeByReference((profile: Profile): Map<string | number, number> => {
  const frames: Frame[] = []
  profile.forEachFrame((f) => frames.push(f))
  function key(f: Frame) {
    return (f.file ?? '') + f.name
  }
  function compare(a: Frame, b: Frame) {
    return key(a) > key(b) ? 1 : -1
  }
  frames.sort(compare)
  const frameToColorBucket = new Map<string | number, number>()
  for (let i = 0; i < frames.length; i++) {
    frameToColorBucket.set(frames[i].key, Math.floor((255 * i) / frames.length))
  }

  return frameToColorBucket
})

export const getChronoViewFlamechart = (
  profile: Profile,
  rootFilter?: RootFilter,
  {
    getColorBucketForFrame = createGetColorBucketForFrame(getFrameToColorBucket(profile)),
    processor,
  }: {
    getColorBucketForFrame?: (frame: Frame) => number
    processor?: NodeProcessor
  } = {},
): Flamechart => {
  return buildFlamechart(
    {
      minValue: profile.getMinValue(),
      maxValue: profile.getMaxValue(),
      forEachCall: profile.forEachCall.bind(profile),
      formatValue: profile.formatValue.bind(profile),
      getColorBucketForFrame,
    },
    processor,
    rootFilter,
  )
}

export const getNetworkFlamechart = (profile: Profile, rootFilter?: RootFilter): Flamechart => {
  return getChronoViewFlamechart(profile, rootFilter, {
    getColorBucketForFrame: (_) => 1,
  })
}

export const getReactTimelineFlamechart = (profile: Profile, rootFilter?: RootFilter): Flamechart => {
  return getChronoViewFlamechart(profile, rootFilter, {
    getColorBucketForFrame(frame: TimingFrame) {
      switch (frame.info?.type) {
        case 'component render':
          return 160
        case 'react measure':
          return 200
        case 'native event':
          return 50
        case 'suspense event':
          return 90
        default:
          return 0
      }
    },
    processor: (node) => {
      if (!(node.frame instanceof TimingFrame)) {
        return {}
      }
      const lane = node.frame.info?.laneNum || 0
      return {
        level: parseInt(lane as string),
      }
    },
  })
}

export const getReactProfilingFlamechart = (profile: Profile, rootFilter?: RootFilter): Flamechart => {
  if (!(profile instanceof ReactProfile)) {
    throw new Error('need react profile')
  }
  return getChronoViewFlamechart(profile, rootFilter, {
    getColorBucketForFrame(frame) {
      if (!(frame instanceof ReactFrame)) {
        return 0
      }
      if (frame.info?.didRender) {
        return Math.max(((frame.info?.selfDuration ?? 0) / profile.maxSelfDuration) * 255, 2)
      } else if (frame.info?.isRenderPath) {
        return 1
      } else {
        return 0
      }
    },
  })
}

export const getGroupedTracehouseFlamechart = (profile: Profile, rootFilter?: RootFilter): Flamechart => {
  return getChronoViewFlamechart(profile, rootFilter, {
    getColorBucketForFrame: (n) => {
      if (n instanceof TracehouseGroupedFrame) {
        return n.level
      }
      return 0
    },
    processor(node) {
      if (node instanceof NonStackTreeNode && node.frame instanceof TracehouseGroupedFrame) {
        return {
          level: node.frame.level,
        }
      }
      throw new Error('Unexpected node type')
    },
  })
}

export const FlamechartFactoryMap = {
  /**
   * Default flamechart
   */
  default: getChronoViewFlamechart,
  /**
   * used for network flow chart
   */
  network: getNetworkFlamechart,
  'tracehouse-grouped': getGroupedTracehouseFlamechart,
  /**
   * used for react timeline flame chart
   */
  'react-timeline': getReactTimelineFlamechart,
  /**
   * used for react profiling flame chart
   */
  'react-profiling': getReactProfilingFlamechart,
}

export type FlamechartFactory = (t: Profile, rootFilter?: RootFilter) => Flamechart
