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

/// <reference path="../../node_modules/lighthouse/types/externs.d.ts" />
/// <reference path="../../node_modules/lighthouse/types/config.d.ts" />
/// <reference path="../../node_modules/lighthouse/types/gatherer.d.ts" />
/// <reference path="../../node_modules/lighthouse/types/audit.d.ts" />
/// <reference path="../../node_modules/lighthouse/types/audit-details.d.ts" />
/// <reference path="../../node_modules/lighthouse/types/lhr.d.ts" />
/// <reference path="../../node_modules/lighthouse/types/artifacts.d.ts" />
/// <reference path="../../node_modules/lighthouse/types/protocol.d.ts" />
/// <reference path="../../node_modules/lighthouse/types/i18n.d.ts" />
/// <reference path="../../node_modules/lighthouse/types/treemap.d.ts" />
/// <reference path="../../node_modules/lighthouse/types/global-lh.d.ts" />
/// <reference path="../../node_modules/@types/react-devtools-inline/common.d.ts" />

interface ClassOf<T> {
  new (): T
}

module LH {
  export interface Flags extends SharedFlagsSettings {
    customFlags?: {
      headers?: Record<string, Record<string, string>>
      reactProfiling?: boolean
    }
  }

  export interface ScreencastGathererResult {
    path: string
    firstFrameTime: number
    lastFrameTime: number
  }

  export interface PerfseeGathererArtifacts extends LH.GathererArtifacts {
    RequestInterception: null
    Screencast: ScreencastGathererResult | null
    CpuProfiler: Crdp.Profiler.Profile
    ConsoleLogger: null
    ReactProfiler: ProfilingDataExport | null
    LcpElement: any
  }

  export interface PerfseeGathererInstance extends Gatherer.GathererInstance {
    name: keyof PerfseeGathererArtifacts
  }

  export interface PerfseePassJson extends LH.Config.PassJson {
    gatherers?: (LH.Config.GathererJson | LH.PerfseeGathererInstance | ClassOf<LH.PerfseeGathererInstance>)[]
  }

  export interface PerfseeArtifacts extends LH.Artifacts, PerfseeGathererArtifacts {}

  export interface PerfseeRunnerResult extends LH.RunnerResult {
    artifacts: PerfseeArtifacts
  }
}

declare module 'lighthouse' {
  declare namespace lighthouse {}
  declare function lighthouse(
    url?: string,
    flags?: LH.Flags,
    configJSON?: LH.Config.Json,
    connection?: any,
  ): Promise<LH.PerfseeRunnerResult | undefined>

  export = lighthouse
}
