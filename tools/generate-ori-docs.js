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

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

execSync('yarn build:rs --scope=@perfsee/ori')

const { generateDocs } = require('@perfsee/ori')

const rules = Object.entries(generateDocs())

const header = '# Perfsee source code analyzing rules'

const tableHeader = `## Rules

|rule|
|----|`
const ruleTable = rules.map(([rule]) => `|[${rule}](#${rule})|`).join('\n')

const table = [tableHeader, ruleTable].join('\n')

const body = rules
  .map(([rule, desc]) => {
    return `### **${rule}**
${desc}`
  })
  .join('\n\n')

const content = [header, table, body].join('\n\n')

fs.writeFileSync(path.join(process.cwd(), 'docs', 'ori-rules.md'), content)
