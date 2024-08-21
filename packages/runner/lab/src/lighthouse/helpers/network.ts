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

import { dynamicImport } from '@perfsee/job-runner-shared'
import { ArtifactSchema, LifeCycle, TimingSchema, ServerTiming } from '@perfsee/shared'

export type NetworkRecord = ReturnType<typeof getNetworkRecords> extends Promise<infer T>
  ? T extends Array<any>
    ? T[number]
    : never
  : never

export const getRequestType = (item: ArtifactSchema) => {
  return item[LifeCycle.responseReceived]?.type ?? item[LifeCycle.loadingFailed]?.type ?? ''
}

export const getRequestTimings = (item: ArtifactSchema, record: LH.Artifacts.NetworkRequest) => {
  const defaultTiming = record.timing
  const endTime = record.networkEndTime
  const defaultResReceivedTime = record.responseHeadersEndTime
  const timing = defaultTiming ?? item[LifeCycle.responseReceived]?.response?.timing
  const responseReceivedTime = defaultResReceivedTime ?? item[LifeCycle.responseReceived]?.timestamp ?? 0

  const redirectSource = record.redirectSource
  const redirectTiming = redirectSource
    ? [
        {
          name: 'Redirect',
          value: redirectSource.networkEndTime - getFirstRedirectSource(redirectSource).networkRequestTime,
        },
      ]
    : []

  if (!timing) {
    const start = item[LifeCycle.requestWillBeSent]?.timestamp ?? 0
    return redirectTiming.concat([
      {
        name: 'Blocked',
        value: responseReceivedTime - start,
      },
      {
        name: 'Receive',
        value: responseReceivedTime - start,
      },
    ])
  } else {
    const receiveTime = endTime - responseReceivedTime
    return redirectTiming.concat(getFromNetworkRequestTiming(timing, responseReceivedTime, receiveTime))
  }
}

const getFromNetworkRequestTiming = (
  timing: TimingSchema,
  responseReceivedTime: number /**timestamp */,
  receiveTime: number,
) => {
  const responseReceived = responseReceivedTime - timing.requestTime * 1000

  const blockingEnd = [timing.dnsStart, timing.connectStart, timing.sendStart, responseReceived].find((v) => v > 0) ?? 0
  return [
    {
      name: 'Blocked',
      value: blockingEnd,
    },
    {
      name: 'DNS',
      value: timing.dnsEnd - timing.dnsStart,
    },
    {
      name: 'Connect',
      value: timing.connectEnd - timing.connectStart,
    },
    {
      name: 'SSL',
      value: timing.sslEnd - timing.sslStart,
    },
    {
      name: 'Send',
      value: timing.sendEnd - timing.sendStart,
    },
    {
      name: 'Wait',
      value:
        responseReceived - Math.max(timing.sendEnd, timing.connectEnd, timing.dnsEnd, timing.proxyEnd, blockingEnd),
    },
    {
      name: 'Receive',
      value: receiveTime,
    },
  ]
}

export const formatResponseHeader = (headers?: { name: string; value: string }[]) => {
  if (!headers) {
    return {}
  }
  return headers.reduce((p, c) => {
    if (p[c.name]) {
      p[c.name] += `, ${c.value}`
    } else {
      p[c.name] = c.value
    }
    return p
  }, {}) as Record<string, string>
}

export const getRequestHeader = (item: ArtifactSchema) => {
  return {
    ...item[LifeCycle.requestWillBeSent]?.request?.headers,
    ...item[LifeCycle.requestWillBeSentExtraInfo]?.headers,
  }
}

export async function getNetworkRecords(devtoolsLog: LH.DevtoolsLog) {
  const finalMap = getDevtoolsLogMap(devtoolsLog)
  const { NetworkRecorder } = (await dynamicImport(
    'lighthouse/core/lib/network-recorder.js',
  )) as typeof import('lighthouse/core/lib/network-recorder')
  const URL = (
    (await dynamicImport('lighthouse/core/lib/url-utils.js')) as typeof import('lighthouse/core/lib/url-utils')
  ).default
  const records: LH.Artifacts.NetworkRequest[] = NetworkRecorder.recordsFromLogs(devtoolsLog)

  const earliestStartTime = records.reduce((min: number, record) => Math.min(min, record.networkRequestTime), Infinity)

  const formatTime = (time: number) =>
    time < earliestStartTime || !Number.isFinite(time) ? undefined : time - earliestStartTime

  return records
    .map((record, i) => {
      if (record.protocol === 'blob' || record.protocol === 'data') {
        return undefined
      }

      const data = finalMap.get(record.requestId)
      let redirectData: ArtifactSchema | undefined
      const match = record.requestId.match('(.*):redirect')
      if (match) {
        const redirectId = match[1]
        redirectData = finalMap.get(redirectId) as ArtifactSchema
      }

      if (!data && !redirectData) {
        return undefined
      }

      const requestHeader = data ? getRequestHeader(data) : getRequestHeader(redirectData!)
      const responseHeader = formatResponseHeader(record.responseHeaders)

      const startTime = formatTime(record.networkRequestTime)
      const endTime = formatTime(record.networkEndTime)

      return {
        index: i,
        url: URL.elideDataURI(record.url),
        startTime: startTime!,
        baseTimestamp: Math.round(earliestStartTime * 1000),
        method: record.requestMethod,
        status: record.statusCode.toString(),
        protocol: record.protocol,
        priority: record.priority,
        type: record.resourceType ?? getRequestType(data || redirectData!),
        size: record.resourceSize,
        transferSize: record.transferSize,
        timing: (endTime ?? 0) - (startTime ?? 0),
        timings: getRequestTimings(data || redirectData!, record),
        requestHeader,
        responseHeader,
        // for performance advice
        statusCode: record.statusCode,
        mimeType: record.mimeType,
        resourceType: record.resourceType,
        endTime,
        resourceSize: record.resourceSize,
        initiator: record.initiator,
        requestId: record.requestId,
        fromCache: record.fromDiskCache
          ? 'disk'
          : record.fromMemoryCache
          ? 'memory'
          : record.fromPrefetchCache
          ? 'prefetch'
          : false,
        serverTimings: getServerTimingFromResponseHeaders(responseHeader),
      }
    })
    .filter(<T>(v: T | undefined): v is T => v !== undefined)
}

function getDevtoolsLogMap(devtoolsLog: LH.DevtoolsLog) {
  const finalMap = new Map<string, ArtifactSchema>()

  for (const v of devtoolsLog) {
    if (!v.params || !('requestId' in v.params) || !v.params.requestId) {
      continue
    }

    const data = finalMap.get(v.params.requestId)
    const res = {
      [v.method]: v.params,
    } as unknown as ArtifactSchema

    finalMap.set(v.params.requestId, data ? { ...data, ...res } : res)
  }
  return finalMap
}

function getServerTimingFromResponseHeaders(headers: Record<string, string>): ServerTiming[] {
  if (!headers['server-timing'] && !headers['Server-Timing']) {
    return []
  }

  return (headers['server-timing'] || headers['Server-Timing']).split(',').map((metric) => {
    const parts = metric.trim().split(';')
    const name = parts[0]
    let dur
    let desc

    parts.slice(1).forEach((part) => {
      const [key, value] = part.split('=')
      if (key === 'dur') {
        dur = parseFloat(value)
      } else if (key === 'desc') {
        desc = value.replace(/"/g, '')
      }
    })

    return { name, dur, desc }
  })
}

function getFirstRedirectSource(record: LH.Artifacts.NetworkRequest): LH.Artifacts.NetworkRequest {
  if (!record.redirectSource) {
    return record
  }

  return getFirstRedirectSource(record.redirectSource)
}
