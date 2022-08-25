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

import { Uri } from 'vscode'

import { Texts } from '../constants'
import { DefinedDecorationUris } from '../view/file-decoration-provider'

const unit = ['ms', 'sec', 'min'] as const

export const formatTime = (microsecond: number): { value: string; unit: 'ms' | 'sec' | 'min' } => {
  let unitIndex = 0
  let time = microsecond
  time /= 1000
  if (time > 1000) {
    time /= 1000
    unitIndex += 1
    if (time > 60) {
      time /= 60
      unitIndex += 1
    }
  }
  return { value: Number.isInteger(time) ? time.toString() : time.toFixed(2), unit: unit[unitIndex] }
}

export const formatTimeToEmoji = (microseond: number, slowerReference = 10000, fasterReference = 0): string => {
  const scale = (microseond - fasterReference) / (slowerReference - fasterReference)
  if (scale >= 0.8) {
    return Texts.SlowerEmoji
  } else if (scale >= 0.6) {
    return Texts.SlowEmoji
  } else if (scale >= 0.4) {
    return Texts.MediumEmoji
  } else if (scale >= 0.2) {
    return Texts.FastEmoji
  } else {
    return Texts.FasterEmoji
  }
}

export const formatTimeToDecorationUri = (microseond: number, slowerReference = 10000, fasterReference = 0): Uri => {
  const scale = (microseond - fasterReference) / (slowerReference - fasterReference)
  if (scale >= 0.8) {
    return DefinedDecorationUris.slower
  } else if (scale >= 0.6) {
    return DefinedDecorationUris.slow
  } else if (scale >= 0.4) {
    return DefinedDecorationUris.medium
  } else if (scale >= 0.2) {
    return DefinedDecorationUris.fast
  } else {
    return DefinedDecorationUris.faster
  }
}

export const formatScoreToEmoji = (score: number) => {
  if (score >= 60) {
    return Texts.GoodEmoji
  } else {
    return Texts.BadEmoji
  }
}
