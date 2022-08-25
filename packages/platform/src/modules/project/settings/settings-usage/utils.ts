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

export enum USAGE_FORMAT {
  Hour = 'Hour',
  Minute = 'Minute',
}

const formatToHours = (usage: number): string => {
  const minutes = Math.round(usage / 1000 / 60)

  return minutes ? `${Math.floor(minutes / 60)}h${Math.round(minutes % 60)}m` : '0'
}
const formatToMinutes = (usage: number, showSeconds = false): string => {
  const seconds = Math.round(usage / 1000)

  if (!seconds) return '0'

  if (showSeconds) {
    return seconds ? `${Math.floor(seconds / 60)}m${Math.round(seconds % 60)}s` : '0'
  }

  return `${Math.round(seconds / 60)}m`
}

export const formatUsage = (usage: number, type: USAGE_FORMAT, showSeconds = false): string => {
  return type === USAGE_FORMAT.Hour ? formatToHours(usage) : formatToMinutes(usage, showSeconds)
}
