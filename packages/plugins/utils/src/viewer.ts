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

import { createReadStream, existsSync, statSync } from 'fs'
import { createServer } from 'http'
import { join } from 'path'

import { bold } from 'chalk'
import FileType from 'file-type'

import { BundleResult, calcBundleScore, ModuleTreeNode } from '@perfsee/bundle-analyzer'

interface Data {
  branch: string
  hash: string
  report: BundleResult
  content: ModuleTreeNode[]
}

export interface ServerOptions {
  /**
   * Port the local report server will listen on
   *
   * @default 8080
   */
  port?: number

  /**
   * Host of the local report server
   *
   * @default '127.0.0.1'
   */
  host?: string

  /**
   * Path of the static files used to render report.
   *
   * Unless you want to change the default report viewer, otherwise leave it undefined.
   */
  publicPath?: string
}

export function renderReportViewer(entry: string, data: Data) {
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
			window.bundleReport = ${JSON.stringify(data.report)};
			window.bundleContent = ${JSON.stringify(data.content)};
		</script>
	</head>

	<body>
		<div id="app" style="min-height: 100vh;display: flex;flex-direction: column;"></div>
		<script type="text/javascript" src="${entry}"></script>
	</body>
	</html>`
}

export async function startServer(data: Data, options: ServerOptions = {}) {
  const { port = 8080, host = '127.0.0.1', publicPath = join(__dirname, '../public') } = options

  const server = createServer((req, res) => {
    if (!req.url) {
      res.writeHead(400)
      res.end()
      return
    }

    if (req.method === 'GET') {
      const url = new URL(req.url, `http://${req.headers.host}`)
      const filepath = join(publicPath, url.pathname)

      if (existsSync(filepath) && statSync(filepath).isFile()) {
        const fileStream = createReadStream(filepath)
        void FileType.stream(fileStream).then((file) => {
          res.writeHead(200, { 'Content-Type': file.fileType?.mime ?? 'text/html' })
          file.pipe(res)
        })
      } else {
        const html = renderReportViewer('/main.js', data)
        res.writeHead(200, { 'Content-Type': 'text/html' })
        res.end(html)
      }
    } else {
      res.writeHead(404)
      res.end()
    }
  })

  await new Promise<void>((resolve, reject) => {
    server.listen(port, host, () => {
      const url = `http://${host}:${port}`

      console.info(
        `${bold('Perfsee Bundle Analyzer')} is started at ${bold(url)}\n` + `Use ${bold('Ctrl+C')} to close it`,
      )
    })

    server
      .on('close', () => {
        resolve()
      })
      .on('error', (e) => {
        reject(e)
      })
  })

  return server
}
