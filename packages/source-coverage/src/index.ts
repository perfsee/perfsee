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

//@ts-expect-error
import ScriptTreemapData from 'lighthouse/lighthouse-core/audits/script-treemap-data'

import { SourceCoverageResult } from '@perfsee/shared'

export interface GenerateSourceCoverageTreemapDataOptions {
  pageUrl: string
  jsCoverageData: LH.GathererArtifacts['JsUsage']
  source: { filename: string; content: string; map?: LH.Artifacts.RawSourceMap }[]
}

export async function generateSourceCoverageTreemapData(options: GenerateSourceCoverageTreemapDataOptions) {
  const scriptUrls = Object.keys(options.jsCoverageData)

  const scripts = scriptUrls
    .map((url) => {
      const source = options.source.find((source) => url.endsWith(source.filename))

      if (source) {
        return {
          url,
          ...source,
        }
      } else {
        return undefined
      }
    })
    .filter((script) => !!script) as (GenerateSourceCoverageTreemapDataOptions['source'][number] & { url: string })[]

  const sourceMaps = scripts.map((script) => ({ scriptUrl: script.url, map: script.map }))
  const scriptElements = scripts.map((script) => ({ src: script.url, content: script.content }))

  const context = { computedCache: new Map() }
  const artifacts = {
    URL: { requestedUrl: options.pageUrl, finalUrl: options.pageUrl },
    JsUsage: options.jsCoverageData,
    SourceMaps: sourceMaps,
    ScriptElements: scriptElements,
  } as Pick<LH.Artifacts, 'URL' | 'JsUsage' | 'SourceMaps' | 'ScriptElements'>
  const result = await (ScriptTreemapData.audit(artifacts, context) as Promise<
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
