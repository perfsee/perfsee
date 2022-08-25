import { NetworkProfile } from './lib/network-profile'
import { CallTreeNodeAttribute, FrameInfo, Profile, StackListProfileBuilder } from './lib/profile'
import { TimingProfile } from './lib/timing-profile'
import { TracehouseProfile } from './lib/tracehouse-profile'
import { TimeFormatter } from './lib/value-formatters'
import { PerfseeFlameChartData, NetworkRequest, TracehouseTask, TimingSchema } from './types'

export function buildProfileFromFlameChartData(data: PerfseeFlameChartData, timeOffset = 0): Profile {
  const duration = data.endTime - data.startTime

  const profile = new StackListProfileBuilder(duration, duration + timeOffset, 0 + timeOffset, (node) => {
    if (node.parent?.isRoot() && node.getTotalWeight() > 50000) {
      return CallTreeNodeAttribute.LONG_TASK
    }

    return CallTreeNodeAttribute.NORMAL
  })

  profile.setValueFormatter(new TimeFormatter('microseconds'))

  profile.appendSampleWithWeight([], timeOffset)

  for (let i = 0; i < data.samples.length; i++) {
    const sample = data.samples[i]

    const stack: FrameInfo[] = sample
      .map((frame) => {
        return data.frames[frame] as FrameInfo
      })
      .filter((frame) => frame.name !== '(idle)')

    const sampleDuration = data.weights[i]

    profile.appendSampleWithWeight(stack, sampleDuration)
  }

  return profile.build()
}

export function buildProfileFromTracehouse(
  data: TracehouseTask[],
  timeOffset = 0,
  taskFilter: (task: TracehouseTask) => boolean = () => true,
): TracehouseProfile {
  const totalWeight = data.length ? data[data.length - 1].endTime * 1000 : 0

  const profile = new TracehouseProfile(totalWeight, totalWeight + timeOffset, 0 + timeOffset)

  profile.setValueFormatter(new TimeFormatter('microseconds'))

  const buildTasks = (tasks: TracehouseTask[]) => {
    for (const task of tasks) {
      if (taskFilter(task)) {
        profile.appendTracehouseTask({
          ...task,
          startTime: task.startTime * 1000 + timeOffset,
          endTime: task.endTime * 1000 + timeOffset,
        })
      }
      buildTasks(task.children)
    }
  }

  buildTasks(data)

  return profile
}

export function buildProfileFromNetworkRequests(requests: NetworkRequest[], timeOffset = 0) {
  const totalWeight = Math.max(...requests.map((request) => request.startTime + request.timing)) * 1000
  const profile = new NetworkProfile(totalWeight, totalWeight + timeOffset, 0 + timeOffset)
  profile.setValueFormatter(new TimeFormatter('microseconds'))
  for (const request of requests) {
    if (request.timing <= 0) {
      continue
    }
    profile.appendNetworkRequestRecord(
      new URL(request.url).pathname || request.url,
      request.startTime * 1000 + timeOffset,
      (request.startTime + request.timing) * 1000 + timeOffset,
      request,
    )
  }
  return profile
}

export function buildProfileFromUserTimings(userTimings: TimingSchema[]) {
  const totalWeight = Math.max(...userTimings.map((timing) => timing.timestamp + (timing.duration ?? 0)))
  const profile = new TimingProfile(totalWeight, totalWeight, 0)
  profile.setValueFormatter(new TimeFormatter('microseconds'))
  for (const timing of userTimings) {
    if (timing.timestamp <= 0 || !timing.duration) {
      profile.appendTiming(timing.name, timing.timestamp, timing.timestamp + 1, timing)
      continue
    }
    profile.appendTiming(timing.name, timing.timestamp, timing.timestamp + timing.duration, timing)
  }
  return profile
}

export * from './components/flamechart-container'
export * from './components/flamechart-group-container'
export * from './components/flamechart-factory'
export { Profile, Frame, CallTreeNode } from './lib/profile'
export { NetworkProfile } from './lib/network-profile'
export { TimingProfile }
export { Flamechart, FlamechartFrame, buildFlamechart } from './lib/flamechart'
export {
  importFromChromeTimeline,
  importMainThreadProfileFromChromeTimeline,
  importFromChromeCPUProfile,
  CPUProfile,
} from './lib/chrome'
export * from './themes/theme'
export { Timing } from './lib/timing'
export * from './lib/profile-search'
export * from './types'
export * from './views'
