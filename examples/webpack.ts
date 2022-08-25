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

import { join } from 'path'

import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import TerserWebpackPlugin from 'terser-webpack-plugin'
import webpack from 'webpack'
import { merge } from 'webpack-merge'

import { PerfseePlugin } from '@perfsee/webpack'

export function runExample(entry: string, webpackConfigToOverride: webpack.Configuration) {
  return new Promise<void>((resolve, reject) => {
    return webpack(
      merge(
        {
          entry,

          mode: 'production',

          devtool: 'cheap-module-source-map',

          output: {
            path: join(__dirname, '..', 'dist', 'example'),
            publicPath: '/',
            filename: '[name].[chunkhash:8].js',
            chunkFilename: '[name].[chunkhash:8].js',
          },
          resolve: {
            extensions: ['.ts', '.tsx', '.js', '.jsx'],
          },

          module: {
            rules: [
              {
                test: /\.m?js?$/,
                resolve: {
                  fullySpecified: false,
                },
              },
              {
                test: /\.tsx?/,
                use: [
                  'thread-loader',
                  {
                    loader: 'ts-loader',
                    options: {
                      transpileOnly: true,
                      happyPackMode: true,
                      configFile: join(process.cwd(), 'examples', 'tsconfig.loader.json'),
                      getCustomTransformers:
                        process.env.DISABLE_TRANSFORMER === 'true'
                          ? null
                          : join(process.cwd(), 'examples', 'transformer.js'),
                      experimentalWatchApi: true,
                    },
                  },
                ],
                exclude: /node_modules/,
              },
              {
                test: /\.css$/,
                use: [
                  MiniCssExtractPlugin.loader,
                  {
                    loader: 'css-loader',
                    options: {
                      sourceMap: false,
                      modules: false,
                      import: true,
                      importLoaders: 1,
                    },
                  },
                  {
                    loader: 'postcss-loader',
                    options: {
                      postcssOptions: require('./postcss.config.js'),
                    },
                  },
                ],
              },
              {
                test: /\.(ttf|eot|woff|woff2|svg)$/i,
                type: 'asset/resource',
              },
            ],
          },

          plugins: [
            new PerfseePlugin({
              failIfNotPass: true,
            }),
            new MiniCssExtractPlugin({
              filename: `[name].[chunkhash:8].css`,
            }),
          ],

          optimization: {
            minimizer: [
              {
                apply: (compiler: webpack.Compiler) => {
                  new TerserWebpackPlugin({
                    parallel: true,
                    extractComments: true,
                    terserOptions: {
                      compress: false,
                    },
                  }).apply(compiler)
                },
              },
            ],
          },
        },
        webpackConfigToOverride,
      ),
    ).run((err, stats) => {
      if (err) {
        console.error(err)
        reject()
      }
      console.info(
        stats!.toString({
          all: false,
          colors: true,
          errors: true,
        }),
      )
      resolve()
    })
  })
}
