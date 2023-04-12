import { ProfilingDataFrontend, ReactComponentMeasure, SuspenseEvent } from 'react-devtools-inline'
import { TimingProfile } from '../timing-profile'
import { TimeFormatter } from '../value-formatters'

export function buildTimelineProfilesFromReactDevtoolProfileData(
  profilingData: ProfilingDataFrontend,
  timeOffset: number,
) {
  const { timelineData } = profilingData
  return timelineData.map((timelineData) => {
    const totalWeight = timelineData.duration * 1000 + timeOffset
    const profile = new TimingProfile(totalWeight, totalWeight, 0)
    profile.setValueFormatter(new TimeFormatter('microseconds'))
    let laneNum = 0

    for (const measure of timelineData.componentMeasures) {
      const timestamp = measure.timestamp * 1000 + timeOffset
      const duration = measure.duration * 1000
      const name = formatMeasureName(measure)
      profile.appendTiming(name, timestamp, timestamp + duration, {
        name,
        timestamp,
        duration,
        type: 'component render',
        laneNum,
      })
    }
    laneNum++

    for (const suspense of timelineData.suspenseEvents) {
      const timestamp = suspense.timestamp * 1000 + timeOffset
      const duration = (suspense.duration ?? 0) * 1000
      const name = formatSuspenseName(suspense)
      profile.appendTiming(name, timestamp, timestamp + duration, {
        name,
        timestamp,
        duration,
        status: suspense.resolution,
        type: 'suspense event',
        laneNum,
      })
    }
    laneNum++

    for (const event of timelineData.nativeEvents) {
      const timestamp = event.timestamp * 1000 + timeOffset
      const duration = (event.duration ?? 0) * 1000
      const name = event.type
      profile.appendTiming(name, timestamp, timestamp + duration, {
        name,
        timestamp,
        duration,
        type: 'native event',
        laneNum,
      })
    }
    laneNum++

    const lanes = timelineData.laneToLabelMap
    for (const [laneId, measures] of timelineData.laneToReactMeasureMap.entries()) {
      const laneLabel = `${lanes.get(laneId)}(${laneId})`
      if (measures.length === 0) {
        continue
      }
      for (const measure of measures) {
        const timestamp = measure.timestamp * 1000 + timeOffset
        const duration = measure.duration * 1000
        const name = `react ${measure.type}`
        profile.appendTiming(name, timestamp, timestamp + duration, {
          name,
          timestamp,
          duration,
          type: 'react measure',
          lane: laneLabel,
          laneNum,
        })
      }
      laneNum++
    }

    return profile
  })
}

function formatSuspenseName(suspense: SuspenseEvent) {
  const name = suspense.componentName ? `${suspense.componentName} ` : ''
  const phase = suspense.phase ? ` during ${suspense.phase}` : ''
  return `${name}suspended${phase}`
}

function formatMeasureName(measure: ReactComponentMeasure) {
  switch (measure.type) {
    case 'render':
      return `${measure.componentName} rendered`
    case 'passive-effect-mount':
      return `${measure.componentName} mounted passive effect`
    case 'layout-effect-mount':
      return `${measure.componentName} mounted layout effect`
    case 'passive-effect-unmount':
      return `${measure.componentName} unmounted passive effect`
    case 'layout-effect-unmount':
      return `${measure.componentName} unmounted layout effect`
  }
}
