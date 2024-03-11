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

import chalk from 'chalk'
import findCacheDir from 'find-cache-dir'
import open from 'open'

import { getBuildEnv } from './build-env'
import { GraphQLClient } from './gql-client'

const PACKAGE_NAME = '@perfsee/package'

interface Data {
  report: any
  benchmarkResult: any
  token: string
  platform?: string
  project: string
  name: string
  history?: any[]
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
		<title>Perfsee pacakge analyzer</title>
		<script>
			window.report = ${JSON.stringify(data.report).replace(/</gu, '\\u003c')};
			window.benchmarkResult = ${JSON.stringify(data.benchmarkResult)?.replace(/</gu, '\\u003c')};
      window.PERFSEE_TOKEN = '${data.token}';
      window.PERFSEE_PLATFORM_HOST = '${data.platform ?? getBuildEnv().platform}';
      window.PROJECT_ID = '${data.project}';
      window.PACKAGE_NAME = '${data.name}';
      window.histories = ${JSON.stringify(
        data.history!.reverse().concat({ ...data.report, size: { raw: data.report.size, gzip: data.report.gzip } }),
      ).replace(/</gu, '\\u003c')};
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
  { fileName = getDefaultReportFileName(), openBrowser = true }: ReportOptions = {},
) {
  if (!fileName) {
    return
  }

  try {
    const result = await GraphQLClient.query({
      query: {
        id: '1',
        operationName: 'packageBundleHistory',
        definitionName: 'packageBundleHistory',
        query: `
      query packageBundleHistory($projectId: ID!, $packageId: ID!, $to: DateTime!, $branch: String, $limit: Int) {
        packageBundleHistory(
          projectId: $projectId
          packageId: $packageId
          to: $to
          branch: $branch
          limit: $limit
        ) {
          id
          packageId
          name
          version
          status
          createdAt
          failedReason
          size {
            raw
            gzip
          }
          hasSideEffects
          hasJSModule
          hasJSNext
          isModuleType
        }
      }`,
      },
      variables: {
        projectId: data.project,
        limit: 22,
        packageId: data.name,
        to: new Date().toString(),
      },
      platform: data.platform,
      token: data.token,
    })

    data.history = result?.data?.packageBundleHistory ?? []
  } catch (e) {
    console.error(chalk.red('[perfsee] get package histories failed.'))
    console.error(chalk.red(String(e)))
    data.history = []
  }

  Object.assign(data.report, {
    status: 'Passed',
    createdAt: new Date().toString(),
  })

  const html = renderReportViewer(data)
  const htmlPath = resolve(fileName)
  writeFileSync(htmlPath, html, 'utf-8')
  console.info(`[perfsee] package report is written to ${htmlPath}`)
  if (openBrowser) {
    try {
      await open(htmlPath)
    } catch (err) {
      console.error(`[perfsee] failed to open default browser`, err)
    }
  }
  return htmlPath
}
