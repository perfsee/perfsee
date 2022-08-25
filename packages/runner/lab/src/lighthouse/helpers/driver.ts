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

export interface Driver {
  on: <T extends keyof LH.CrdpEvents>(eventName: T, callback: (...args: LH.CrdpEvents[T]) => void) => void
  once: <T extends keyof LH.CrdpEvents>(eventName: T, callback: (...args: LH.CrdpEvents[T]) => void) => void
  off: <T extends keyof LH.CrdpEvents>(eventName: T, callback: (...args: LH.CrdpEvents[T]) => void) => void
  sendCommand: <T extends keyof LH.CrdpCommands>(
    method: T,
    ...params: LH.CrdpCommands[T]['paramsType']
  ) => Promise<LH.CrdpCommands[T]['returnType']>

  evaluateAsync: (expression: string, options?: { useIsolation?: boolean }) => Promise<any>
  evaluate: <T extends any[], R extends any>(
    mainFn: (...args: T) => R,
    options: { args: T; useIsolation?: boolean; deps?: Array<string | ((...param: any[]) => any)> },
  ) => Promise<R>
}
