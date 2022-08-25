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

const { createEmotionPlugin } = require('emotion-ts-plugin')
const createTsImportTransformer = require('ts-import-plugin')

const { cypressTransformer } = require('./cypress')

function isEnv(env) {
  return process.env.NODE_ENV === env
}

module.exports = () => {
  const before = []

  if (!isEnv('test')) {
    before.push(cypressTransformer)
  }

  const emotionTransformer = createEmotionPlugin({
    sourcemap: !isEnv('test'),
    autoInject: true,
    jsxImportSource: '@emotion/react',
  })
  before.push(emotionTransformer)

  if (isEnv('production') && typeof process.env.ssr === 'undefined') {
    const tsImportTransformer = createTsImportTransformer([
      {
        style: false,
        libraryName: 'lodash',
        libraryDirectory: null,
        camel2DashComponentName: false,
      },
      {
        style: false,
        libraryName: '@fluentui/react',
        libraryDirectory: 'lib',
        camel2DashComponentName: false,
        transformToDefaultImport: false,
      },
    ])

    before.push(tsImportTransformer)
  }

  return { before }
}
