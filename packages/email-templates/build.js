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

const fs = require('fs')
const path = require('path')

const maizzle = require('@maizzle/framework')

process.chdir(__dirname)

void (async () => {
  fs.rmSync('./dist', { recursive: true, force: true })
  fs.rmSync('./templates', { recursive: true, force: true })
  fs.mkdirSync('./templates')
  await maizzle.build('production')
  const htmlFiles = fs.readdirSync('./dist')

  const templates = {}

  for (let htmlFile of htmlFiles) {
    htmlFile = './dist/' + htmlFile
    const htmlString = fs.readFileSync(htmlFile, 'utf8')
    templates[path.basename(htmlFile, '.html')] = htmlString
  }

  fs.writeFileSync('./templates/templates.json', `${JSON.stringify(templates, null, 2)}`)
})()
