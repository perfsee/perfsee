import { ReactComponentMeasure, SuspenseEvent } from 'react-devtools-inline'
import { TimingProfile } from '../timing-profile'
import { TimeFormatter } from '../value-formatters'
import { ReactDevtoolProfilingDataFrontend } from './types'

export function buildTimelineProfilesFromReactDevtoolProfileData(
  profilingData: ReactDevtoolProfilingDataFrontend,
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
      const name = formatMeasureName(measure, profilingData)
      profile.appendTiming(name, timestamp, timestamp + duration, {
        name,
        timestamp,
        duration,
        type: 'component render',
        laneNum,
        file: getFileLocation(measure, profilingData),
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
        file: getFileLocation(suspense, profilingData),
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

function formatMeasureName(measure: ReactComponentMeasure, profilingData: ReactDevtoolProfilingDataFrontend) {
  const [name, locationId] = measure.componentName.split('@locationId:')
  const parsedLocation = (locationId && profilingData.parsedLocations?.[Number(locationId)]) || null
  const componentName = parsedLocation?.name || name

  switch (measure.type) {
    case 'render':
      return `${componentName} rendered`
    case 'passive-effect-mount':
      return `${componentName} mounted passive effect`
    case 'layout-effect-mount':
      return `${componentName} mounted layout effect`
    case 'passive-effect-unmount':
      return `${componentName} unmounted passive effect`
    case 'layout-effect-unmount':
      return `${componentName} unmounted layout effect`
  }
}

function getFileLocation(
  { componentName }: { componentName?: string },
  profilingData: ReactDevtoolProfilingDataFrontend,
) {
  const locationId = componentName?.split('@locationId:')[1]
  const parsedLocation = typeof locationId === 'string' && profilingData.parsedLocations?.[Number(locationId)]
  return parsedLocation
    ? `${parsedLocation.file}:${parsedLocation.line}:${parsedLocation.col}`
    : (typeof locationId === 'string' && profilingData.fiberLocations?.[Number(locationId)]) || ''
}
