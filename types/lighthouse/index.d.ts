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

interface ClassOf<T> {
  new (): T
}

declare module LH {
  type SharedFlagsSettings = import('lighthouse/types/lhr/settings').SharedFlagsSettings
  type GathererArtifacts = import('lighthouse/types/artifacts').GathererArtifacts
  type Artifacts = import('lighthouse/types/artifacts').Artifacts
  type PassJson = import('lighthouse/types/config').default.PassJson
  type RunnerResult = import('lighthouse/types/lh').RunnerResult
  type GathererInstance<T> = import('lighthouse/types/gatherer').default.GathererInstance<T>
  type Context<T> = import('lighthouse/types/gatherer').default.Context<T>

  export type { Artifacts, TraceEvent, DevtoolsLog, GathererArtifacts } from 'lighthouse/types/artifacts'
  export type {
    CrdpEvents,
    CrdpCommands,
    Crdp,
    Gatherer,
    Result,
    Audit,
    Trace,
    Config,
    Puppeteer,
  } from 'lighthouse/types/lh'
  export type { IcuMessage } from 'lighthouse/types/lhr/i18n'
  export type { Treemap } from 'lighthouse/types/lhr/treemap'

  export interface Flags extends SharedFlagsSettings {
    customFlags?: {
      headers?: Record<string, Record<string, string>>
      reactProfiling?: boolean
      dryRun?: boolean
      withCache?: boolean
    }
    ignoreRedirection?: boolean
    disableCache?: boolean
    bypassServiceWorker?: boolean
    originToForceQuicOn?: string[]
    proxyExcludeHost?: string[]
  }

  export interface ScreencastGathererResult {
    path: string
    firstFrameTime: number
    lastFrameTime: number
  }

  export interface PerfseeGathererArtifacts extends GathererArtifacts {
    RequestInterception?: null
    Screencast?: ScreencastGathererResult | null
    CpuProfiler?: import('lighthouse/types/lh').Crdp.Profiler.Profile
    ConsoleLogger?: null
    ReactProfiler?: ProfilingDataExport | null
    LcpElement?: any | null
    ReactProfiler?: any | null
  }

  type PhaseResultNonPromise = void | PerfseeGathererArtifacts[keyof PerfseeGathererArtifacts]
  export type PhaseResult = PhaseResultNonPromise | Promise<PhaseResultNonPromise>

  export interface PerfseeGathererInstance<D = '__none__'> extends GathererInstance<D> {
    name: keyof PerfseeGathererArtifacts
    getArtifact(_context: Context<'__none__'>): PhaseResult
  }

  export interface PerfseePassJson extends PassJson {
    gatherers?: (
      | import('lighthouse/types/config').default.GathererJson
      | PerfseeGathererInstance
      | ClassOf<PerfseeGathererInstance>
    )[]
  }

  export interface PerfseeArtifacts extends Artifacts, PerfseeGathererArtifacts {}

  export interface PerfseeRunnerResult extends RunnerResult {
    artifacts: PerfseeArtifacts
    report?: string | string[]
  }
}
