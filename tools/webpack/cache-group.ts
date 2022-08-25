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

import { hash } from './utils'

function testPackageName(regexp: RegExp): (module: any) => boolean {
  return (module: any) => module.nameForCondition && regexp.test(module.nameForCondition())
}

export const productionCacheGroups = {
  asyncVendor: {
    test: /[\\/]node_modules[\\/]/,
    name(module: any) {
      // https://hackernoon.com/the-100-correct-way-to-split-your-chunks-with-webpack-f8a9df5b7758
      const name = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1]
      return `npm-async-${hash(name)}`
    },
    priority: Number.MAX_SAFE_INTEGER,
    chunks: 'async' as const,
  },
  antd: {
    name: `npm-${hash('antd')}`,
    test: testPackageName(/[\\/]node_modules[\\/](antd|@ant-design|rc-[^\\/]+)[\\/]/),
    priority: 200,
    enforce: true,
  },
  echarts: {
    name: `npm-${hash('echarts')}`,
    test: testPackageName(/[\\/]node_modules[\\/](echarts|zrender)[\\/]/),
    priority: 200,
    enforce: true,
  },
  react: {
    name: `npm-${hash('react')}`,
    test: testPackageName(/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/),
    priority: 200,
    enforce: true,
  },
  rxjs: {
    name: `npm-${hash('rxjs')}`,
    test: testPackageName(/[\\/]node_modules[\\/]rxjs[\\/]/),
    priority: 200,
    enforce: true,
  },
  lodash: {
    name: `npm-${hash('lodash')}`,
    test: testPackageName(/[\\/]node_modules[\\/]lodash[\\/]/),
    priority: 200,
    enforce: true,
  },
  emotion: {
    name: `npm-${hash('emotion')}`,
    test: testPackageName(/[\\/]node_modules[\\/](@emotion)[\\/]/),
    priority: 200,
    enforce: true,
  },
  sigi: {
    name: `npm-${hash('sigi')}`,
    test: testPackageName(/[\\/]node_modules[\\/](@sigi|@abraham[\\/]reflection)[\\/]/),
    priority: 200,
    enforce: true,
  },
  fluent: {
    name: `npm-${hash('fluent')}`,
    test: testPackageName(/[\\/]node_modules[\\/](@uifabric|@microsoft|@fluentui|office-ui-fabric-react)[\\/]/),
    priority: 200,
    enforce: true,
  },
  vendor: {
    name: 'vendor',
    test: /[\\/]node_modules[\\/]/,
    priority: 190,
    enforce: true,
  },
  styles: {
    name: 'styles',
    test: (module: any) =>
      module.nameForCondition && /\.css$/.test(module.nameForCondition()) && !/^javascript/.test(module.type),
    chunks: 'all' as const,
    minSize: 1,
    minChunks: 1,
    reuseExistingChunk: true,
    priority: 1000,
    enforce: true,
  },
}
