/*
Copyright 2022 ByteDance and/or its affiliates.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import { TimingProfile, TimeFormatter } from '@perfsee/flamechart'
import { MapMapToRecord, ReactTimelineData, ReactComponentMeasure, SuspenseEvent } from '@perfsee/shared'

export function buildProfileFromReactTimelineData(timelineData: ReactTimelineData, timeOffset: number) {
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
  for (const [laneId, measures] of Object.entries(timelineData.laneToReactMeasureMap)) {
    const laneLabel = `${lanes[laneId]}(${laneId})`
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
}

function formatSuspenseName(suspense: MapMapToRecord<SuspenseEvent>) {
  const name = suspense.componentName ? `${suspense.componentName} ` : ''
  const phase = suspense.phase ? ` during ${suspense.phase}` : ''
  return `${name}suspended${phase}`
}

function formatMeasureName(measure: MapMapToRecord<ReactComponentMeasure>) {
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
