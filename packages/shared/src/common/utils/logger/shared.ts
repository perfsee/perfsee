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

export enum Level {
  verbose = 1,
  log = 10,
  info = 20,
  warn = 30,
  error = 40,
  fatal = 50,
  silence = 60,
}

export const levelToAdaptermethod = {
  [Level.log]: 'log',
  [Level.info]: 'info',
  [Level.warn]: 'warn',
  [Level.error]: 'error',
  [Level.fatal]: 'error',
}

export type LogLevel = typeof Level[keyof typeof Level]

export interface Adapter {
  log: (level: Level, message: string, query?: any) => any
  setLevel: (level: LogLevel) => any
  setAdditionalQuery: (query: Dict) => void
}
