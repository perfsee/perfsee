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

import { mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join, resolve } from 'path'

import findCacheDir from 'find-cache-dir'
import open from 'open'

import { BundleResult, calcBundleScore, ModuleTreeNode } from '@perfsee/bundle-analyzer'

export const PACKAGE_NAME = '@perfsee/plugin-utils'

interface Data {
  branch: string
  hash: string
  report: BundleResult
  content: ModuleTreeNode[]
}

export interface ReportOptions {
  /**
   * Automatically open report in default browser.
   *
   * @default true
   */
  openBrowser?: boolean

  /**
   * Path to bundle report file that will be generated.
   * It can be either an absolute path or a path relative to a bundle output directory.
   *
   * By default the report will be output in the cache directory.
   */
  fileName?: string
}

export function renderReportViewer(data: Data) {
  return `<!DOCTYPE html>
		<html lang="en" translate="no">
		<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<style>*,*::before,*::after{box-sizing:border-box}body,h1,h2,h3,h4,p,figure,blockquote,dl,dd{margin:0}ul[role="list"],ol[role="list"]{list-style:none}html:focus-within{scroll-behavior:smooth}body{min-height:100vh;text-rendering:optimizeSpeed;line-height:1.5}a:not([class]){text-decoration-skip-ink:auto}img,picture{max-width:100%;display:block}input,button,textarea,select{font:inherit}@media(prefers-reduced-motion:reduce){html:focus-within{scroll-behavior:auto}*,*::before,*::after{animation-duration:.01ms !important;animation-iteration-count:1 !important;transition-duration:.01ms !important;scroll-behavior:auto !important}}</style>
		<title>Perfsee bundle analyzer</title>
		<script>
			window.artifact = {
				id: 'local',
				branch: '${data.branch}',
				hash: '${data.hash}',
				createdAt: new Date().toISOString(),
				score: ${calcBundleScore(data.report.entryPoints)}
			};
			window.bundleReport = ${JSON.stringify(data.report).replace(/</gu, '\\u003c')};
			window.bundleContent = ${JSON.stringify(data.content).replace(/</gu, '\\u003c')};
		</script>
	</head>

	<body>
		<div id="app" style="min-height: 100vh;display: flex;flex-direction: column;"></div>
		<script>
      ${readFileSync(require.resolve(`${PACKAGE_NAME}/public/report.js`), 'utf-8')}
    </script>
	</body>
	</html>`
}

function getDefaultReportFileName() {
  const cacheDir = findCacheDir({ name: PACKAGE_NAME })
  if (cacheDir) {
    mkdirSync(cacheDir, { recursive: true })
    return join(cacheDir, `report-${Date.now()}.html`)
  }
  return undefined
}

export async function saveReport(
  data: Data,
  outputPath: string,
  { fileName = getDefaultReportFileName(), openBrowser = true }: ReportOptions = {},
) {
  if (!fileName) {
    return
  }
  const html = renderReportViewer(data)
  const htmlPath = resolve(outputPath, fileName)
  writeFileSync(htmlPath, html, 'utf-8')
  console.info(`[perfsee] bundle report is written to ${htmlPath}`)
  if (openBrowser) {
    try {
      await open(htmlPath)
    } catch (err) {
      console.error(`[perfsee] failed to open default browser`, err)
    }
  }
  return htmlPath
}
