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

import { readFileSync } from 'fs'

import HtmlWebpackPlugin from 'html-webpack-plugin'
import webpack from 'webpack'

import { PerfseePlugin } from '@perfsee/webpack'

import { getPackage, pathToRoot } from '../utils'

const browserStyleReset = readFileSync(require.resolve('modern-css-reset'), 'utf-8')

export function getFrontendConfig() {
  const pkg = getPackage('@perfsee/platform')
  return {
    resolve: { mainFields: ['esnext', 'browser', 'module', 'main'] },
    plugins: [
      new HtmlWebpackPlugin({
        favicon: pathToRoot('assets', 'favicon.ico'),
        template: pathToRoot('packages', 'platform', 'index.html'),
        templateParameters: {
          browserStyleReset,
          version: pkg.version,
        },
      }),
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': `"${process.env.NODE_ENV ?? 'production'}"`,
        LOCAL_REPORT: false,
        SERVER: `"${process.env.SERVER ?? ''}"`,
        __IS_SERVER__: process.env.__IS_SERVER__ === 'true',
      }),
      new PerfseePlugin({
        project: 'perfsee',
        severOptions: {
          publicPath: getPackage('@perfsee/plugin-utils').relative('public'),
        },
      }),
    ],
  } as webpack.Configuration
}
