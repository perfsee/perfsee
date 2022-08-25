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

import { formatTime } from '@perfsee/platform/common'
import { PrettyBytes, RequestSchema } from '@perfsee/shared'

import { RequestType } from '../../../snapshot-type'

const URLReg = /http[s]*:\/\/(.+?)(\/.*)/

export function getTransferred(item: RequestSchema, isPretty: true): string
export function getTransferred(item: RequestSchema, isPretty?: false): number
export function getTransferred(item: RequestSchema, isPretty?: boolean) {
  const { transferSize } = item

  return isPretty ? PrettyBytes.stringify(transferSize) : transferSize
}

export function getRequestSize(item: RequestSchema, isPretty: true): string
export function getRequestSize(item: RequestSchema, isPretty?: false): number
export function getRequestSize(item: RequestSchema, isPretty?: boolean) {
  const { size } = item
  return isPretty ? PrettyBytes.stringify(size) : size
}

export const getRequestName = (item: RequestSchema) => {
  const [, , name] = item.url?.match(URLReg) ?? []
  return name && name !== '/' ? name : item.url ?? ''
}

export const getRequestDomain = (item: RequestSchema) => {
  const [, domain] = item.url?.match(URLReg) ?? []
  return domain ?? ''
}

export function getStartTime(item: RequestSchema, isPretty: true): string
export function getStartTime(item: RequestSchema, isPretty?: false): number
export function getStartTime(item: RequestSchema, isPretty?: boolean) {
  const { startTime } = item as RequestSchema

  const format = formatTime(startTime)
  return isPretty ? `${format.value}${format.unit}` : startTime
}

export const PrioritySortKey = {
  VeryHigh: 4,
  High: 3,
  Medium: 2,
  Low: 1,
}

export const needOptimize = (request: RequestSchema) => {
  return needOptimizeTransferred(request) || needOptimizeTiming(request) || needOptimizeCompression(request)
}

export const needOptimizeTransferred = (request: RequestSchema) => {
  // transferred > 4M
  return getTransferred(request) > 1000 * 1000 * 4
}

export const needOptimizeTiming = (request: RequestSchema) => {
  // timing > 1s
  return request.timing > 1000
}

export const needOptimizeCompression = (request: RequestSchema) => {
  const { responseHeader, type } = request

  const formatHeader = {}
  Object.keys(responseHeader).forEach((key) => {
    formatHeader[key.toLocaleLowerCase()] = responseHeader[key]
  })

  const encoding = formatHeader['content-encoding']
  const contentType = formatHeader['content-type']

  const size = getRequestSize(request)

  // size > 10kb &&
  // It's not an otf or ttf font &&
  // request type isn't image/video &&
  // content-encoding isn't gzip/deflate/br &&
  // content-type isn't application/octet-stream
  return (
    size > 1000 * 10 &&
    (type === RequestType.Font
      ? /\.otf$|\.ttf$/.test(request.url)
      : [RequestType.Image, RequestType.Media].every((v) => v !== type)) &&
    contentType !== 'application/octet-stream' &&
    ['gzip', 'deflate', 'br'].every((v) => v !== encoding)
  )
}

export const needOptimizeCache = (request: RequestSchema) => {
  const formatHeader = {}
  Object.keys(request.responseHeader).forEach((key) => {
    formatHeader[key.toLocaleLowerCase()] = request.responseHeader[key]
  })

  return (
    (!formatHeader['cache-control'] && !formatHeader['access-control-max-age']) ||
    formatHeader['pragma'] === 'no-cache' ||
    formatHeader['expires'] === 0 ||
    formatHeader['expires'] === 1 ||
    ['private', 'no-store', 'no-cache'].some((v) => v === formatHeader['cache-control'])
  )
}
