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

/*
Portions of this software were originally licensed under the MIT License.
See the MIT License for more details.
*/

/*
MIT License

Copyright (c) 2017 Shubham Kanodia

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

/*
The modifications to the original software were made by ByteDance,
and are licensed under the Apache License, Version 2.0.
*/

import autoprefixer from 'autoprefixer'
import builtinModules from 'builtin-modules'
import CssoWebpackPlugin from 'csso-webpack-plugin'
import escapeRegex from 'escape-string-regexp'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import TerserPlugin from 'terser-webpack-plugin'
import webpack, { Entry } from 'webpack'
import { merge } from 'webpack-merge'
import WriteFilePlugin from 'write-file-webpack-plugin'

import { Externals } from '../common.types'

const log = require('debug')('bp:webpack')
const { ESBuildMinifyPlugin } = require('esbuild-loader')

type MakeWebpackConfigOptions = {
  packageName: string
  externals: Externals
  debug?: boolean
  entry: string | string[] | Entry
  minifier: 'esbuild' | 'terser'
  webpackConfig?: webpack.Configuration
}

type NodeBuiltIn = {
  [key: string]: boolean | 'empty'
}

export default function makeWebpackConfig({
  packageName,
  entry,
  externals,
  debug,
  minifier,
  webpackConfig,
}: MakeWebpackConfigOptions): webpack.Configuration {
  const externalsRegex = makeExternalsRegex(externals.externalPackages)
  const isExternalRequest = (request: string) => {
    const isPeerDep = externals.externalPackages.length ? externalsRegex.test(request) : false
    const isBuiltIn = externals.externalBuiltIns.includes(request)
    return isPeerDep || isBuiltIn
  }

  log('external packages %o', externalsRegex)

  const builtInNode: NodeBuiltIn = {}
  builtinModules.forEach((mod) => {
    builtInNode[mod] = 'empty'
    builtInNode[`node:${mod}`] = 'empty'
  })

  builtInNode['setImmediate'] = false
  builtInNode['console'] = false
  builtInNode['process'] = false
  builtInNode['Buffer'] = false

  // Don't mark an import as built in if it is the name of the package itself
  // eg. `events`
  if (builtInNode[packageName]) {
    builtInNode[packageName] = false
  }

  const config: webpack.Configuration = {
    entry: entry,
    mode: 'production',
    // bail: true,
    optimization: {
      namedChunks: true,
      runtimeChunk: { name: 'runtime' },
      minimize: true,
      splitChunks: {
        cacheGroups: {
          styles: {
            name: 'main',
            test: /\.css$/,
            chunks: 'all',
            enforce: true,
          },
        },
      },
      minimizer: [
        ...(minifier === 'terser'
          ? [
              new TerserPlugin({
                parallel: true,
                terserOptions: {
                  ie8: false,
                  output: {
                    comments: false,
                  },
                },
              }),
            ]
          : [
              new ESBuildMinifyPlugin({
                target: 'esnext',
              }),
            ]),
        new CssoWebpackPlugin({ restructure: false }),
      ],
    },
    plugins: [
      new webpack.IgnorePlugin(/^electron$/),
      // @ts-expect-error
      new MiniCssExtractPlugin({
        // Options similar to the same options in webpackOptions.output
        // both options are optional
        filename: '[name].bundle.css',
        chunkFilename: '[id].bundle.css',
      }),
      ...(debug ? [new WriteFilePlugin()] : []),
    ],
    resolve: {
      modules: ['node_modules'],
      cacheWithContext: false,
      extensions: ['.web.mjs', '.mjs', '.web.js', '.js', '.mjs', '.json', '.css', '.sass', '.scss'],
      mainFields: ['browser', 'module', 'main', 'style'],
    },
    module: {
      rules: [
        {
          test: /\.css$/,
          use: [MiniCssExtractPlugin.loader, require.resolve('css-loader')],
        },
        // see https://github.com/apollographql/react-apollo/issues/1737
        {
          type: 'javascript/auto',
          test: /\.mjs$/,
          use: [],
        },
        {
          test: /\.(js|cjs)$/,
          loader: [
            // support CLI tools that start with a #!/usr/bin/node
            require.resolve('shebang-loader'),
            // ESBuild Minifier doesn't auto-remove license comments from code
            // So, we break ESBuild's heuristic for license comments match. See github.com/privatenumber/esbuild-loader/issues/87
            {
              loader: require.resolve('string-replace-loader'),
              options: {
                multiple: [
                  { search: '@license', replace: '@silence' },
                  { search: /\/\/!/g, replace: '//' },
                  { search: /\/\*!/g, replace: '/*' },
                ],
              },
            },
            {
              loader: require.resolve('babel-loader'),
              options: {
                presets: [['@babel/preset-env', { targets: 'last 2 versions' }]],
              },
            },
          ],
        },

        {
          test: /\.(html|svelte)$/,
          use: {
            loader: require.resolve('svelte-loader'),
            options: {
              emitCss: true,
            },
          },
        },
        // {
        //   test: /\.vue$/,
        //   loader: require.resolve('vue-loader'),
        // },
        {
          test: /\.(scss|sass)$/,
          loader: [
            MiniCssExtractPlugin.loader,
            require.resolve('css-loader'),
            {
              loader: require.resolve('postcss-loader'),
              options: {
                plugins: () => [autoprefixer()],
              },
            },
            require.resolve('sass-loader'),
          ],
        },
        {
          test: /\.less$/,
          loader: [
            MiniCssExtractPlugin.loader,
            require.resolve('css-loader'),
            {
              loader: require.resolve('postcss-loader'),
              options: {
                plugins: () => [
                  autoprefixer({
                    browsers: [
                      'last 5 Chrome versions',
                      'last 5 Firefox versions',
                      'Safari >= 8',
                      'Explorer >= 10',
                      'edge >= 12',
                    ],
                  }),
                ],
              },
            },
            {
              loader: require.resolve('less-loader'),
              options: {
                webpackImporter: true,
              },
            },
          ],
        },
        {
          test: /\.(woff|woff2|eot|ttf|svg|png|jpeg|jpg|gif|webp)$/,
          loader: require.resolve('file-loader'),
          options: {
            name: '[name].bundle.[ext]',
            emitFile: true,
          },
        },
      ],
    },
    node: builtInNode,
    output: {
      filename: 'bundle.js',
      pathinfo: false,
    },
    externals: (_context, request, callback) =>
      isExternalRequest(request) ? callback(null, 'commonjs ' + request) : callback(),
  }

  if (webpackConfig) {
    return merge(config, webpackConfig)
  }

  return config
}

function makeExternalsRegex(externals: string[]) {
  let externalsRegex = externals.map((dep) => `^${escapeRegex(dep)}$|^${escapeRegex(dep)}\\/`).join('|')

  externalsRegex = `(${externalsRegex})`

  return new RegExp(externalsRegex)
}
