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

import { SourceCoverageResult } from '@perfsee/shared'

export interface GenerateSourceCoverageTreemapDataOptions {
  pageUrl: string
  jsCoverageData: LH.GathererArtifacts['JsUsage']
  source: { filename: string; content: string; map?: LH.Artifacts.RawSourceMap }[]
}

function dynamicImport(specifier: string): Promise<any> {
  // eslint-disable-next-line
  return new Function('specifier', 'return import(specifier)')(specifier)
}

export async function generateSourceCoverageTreemapData(options: GenerateSourceCoverageTreemapDataOptions) {
  const { default: ScriptTreemapData } = (await dynamicImport(
    'lighthouse/core/audits/script-treemap-data.js',
  )) as typeof import('lighthouse/core/audits/script-treemap-data')

  const scriptUrls = Object.values(options.jsCoverageData) as LH.Crdp.Profiler.ScriptCoverage[]

  const scripts = scriptUrls
    .map(({ scriptId, url }) => {
      const source = options.source.find((source) => url.endsWith(source.filename))

      if (source) {
        return {
          url,
          scriptId,
          ...source,
        }
      } else {
        return undefined
      }
    })
    .filter((script) => !!script) as (GenerateSourceCoverageTreemapDataOptions['source'][number] & {
    url: string
    scriptId: string
  })[]

  const sourceMaps = scripts.map((script) => ({ scriptUrl: script.url, map: script.map, scriptId: script.scriptId }))
  const scriptElements = scripts.map((script) => ({
    scriptId: script.scriptId,
    url: script.url,
    content: script.content,
    name: script.filename,
    scriptLanguage: 'JavaScript',
    length: script.content.length,
  }))

  const context = { computedCache: new Map(), options: {}, settings: {} as any } as LH.Audit.Context
  const artifacts = {
    URL: { requestedUrl: options.pageUrl, finalDisplayedUrl: options.pageUrl },
    JsUsage: options.jsCoverageData,
    SourceMaps: sourceMaps,
    Scripts: scriptElements,
  } as Pick<LH.Artifacts, 'URL' | 'JsUsage' | 'SourceMaps' | 'Scripts' | 'devtoolsLogs' | 'traces'>
  const result = await (ScriptTreemapData.audit(artifacts as LH.Artifacts, context) as Promise<
    LH.Audit.Product & { details: LH.Audit.Details.TreemapData }
  >)

  return {
    lhr: {
      requestedUrl: options.pageUrl,
      finalUrl: options.pageUrl,
      configSettings: {
        locale: 'en-US',
      },
      audits: { 'script-treemap-data': result },
    },
  } as SourceCoverageResult
}
