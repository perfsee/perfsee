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

import emoji from 'remark-emoji'
import images from 'remark-images'
import TerserPlugin from 'terser-webpack-plugin'
import webpack from 'webpack'
import WebpackDevServer from 'webpack-dev-server'
import { merge } from 'webpack-merge'

import { watchRoutes, watchGraphqlSchema } from '../codegen'
import { IN_CI, rootPath, packages, exists } from '../utils'

import { productionCacheGroups } from './cache-group'
import { IgnoreNotFoundExportPlugin } from './ignore-not-found-plugin'
import svgoConfig from './svgo.config.json'

const isProduction = () => process.env.NODE_ENV === 'production'

const OptimizeOptionOptions: () => webpack.Configuration['optimization'] = () => ({
  minimize: isProduction(),
  minimizer: [
    new TerserPlugin({
      parallel: true,
      extractComments: true,
      terserOptions: {
        parse: {
          ecma: 2019,
        },
        compress: {
          comparisons: false,
        },
        output: {
          comments: false,
          // https://github.com/facebookincubator/create-react-app/issues/2488
          ascii_only: true,
        },
      },
    }),
  ],
  removeEmptyChunks: true,
  providedExports: true,
  usedExports: true,
  sideEffects: true,
  removeAvailableModules: true,
  runtimeChunk: {
    name: 'runtime',
  },
  splitChunks: {
    chunks: 'all',
    minSize: 1,
    minChunks: 1,
    maxInitialRequests: Number.MAX_SAFE_INTEGER,
    maxAsyncRequests: Number.MAX_SAFE_INTEGER,
    cacheGroups: isProduction() ? productionCacheGroups : { default: false, vendors: false },
  },
})

const config: () => webpack.Configuration = () => {
  let publicPath = process.env.PUBLIC_PATH ?? (isProduction() ? '' : 'http://localhost:8080')
  publicPath = publicPath.endsWith('/') ? publicPath : `${publicPath}/`

  return {
    context: rootPath,
    output: {
      path: join(rootPath, 'dist'),
      publicPath,
    },

    mode: isProduction() ? 'production' : 'development',

    devtool: isProduction() ? 'hidden-nosources-source-map' : 'eval-cheap-module-source-map',

    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.json', '.gql'],
      alias: packages.reduce(
        (alias, pkg) => {
          const index = pkg.relative('index.js')
          alias[pkg.name] = exists(index) ? index : pkg.srcPath
          return alias
        },
        {
          '@fluentui/theme': join(rootPath, 'node_modules', '@fluentui', 'theme'),
          tslib: join(rootPath, 'node_modules', 'tslib', 'tslib.es6.js'),
        },
      ),
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
          include: require.resolve('serialize-javascript'),
          sideEffects: false,
        },
        {
          oneOf: [
            {
              test: /\.tsx?$/,
              use: [
                'thread-loader',
                {
                  loader: 'ts-loader',
                  options: {
                    transpileOnly: true,
                    happyPackMode: true,
                    configFile: join(process.cwd(), 'tsconfig.json'),
                    experimentalWatchApi: true,
                    getCustomTransformers: join(process.cwd(), 'tools', 'webpack', 'ts-transformers'),
                    compilerOptions: {
                      jsx: isProduction() ? 'react-jsx' : 'react-jsxdev',
                    },
                  },
                },
              ],
              exclude: /node_modules/,
            },
            {
              test: /\.mdx?$/,
              use: [
                {
                  loader: '@mdx-js/loader',
                  options: {
                    providerImportSource: '@mdx-js/react',
                    remarkPlugins: [images, emoji],
                  },
                },
              ],
              exclude: /node_modules/,
            },
            {
              test: /\.svg$/,
              use: [
                'thread-loader',
                {
                  loader: '@svgr/webpack',
                  options: {
                    icon: true,
                    svgoConfig,
                  },
                },
              ],
              exclude: [/node_modules/],
            },
            {
              test: /\.(png|jpg|gif|svg|webp)$/,
              type: 'asset/resource',
            },
            {
              test: /\.(ttf|eot|woff|woff2)$/i,
              type: 'asset/resource',
            },
            {
              test: /\.txt$/,
              loader: 'raw-loader',
            },
            {
              test: /\.css$/i,
              use: ['style-loader', 'css-loader'],
            },
          ],
        },
      ],
    },

    plugins: [
      ...(IN_CI ? [] : [new webpack.ProgressPlugin({ percentBy: 'entries' })]),
      new IgnoreNotFoundExportPlugin(),
    ],
    optimization: OptimizeOptionOptions(),
  }
}

export async function startDevServer(entry: string, externalConfig: webpack.Configuration) {
  return Promise.all([watchRoutes(), watchGraphqlSchema()]).then(async () => {
    const compiler = webpack(merge(config(), { entry }, externalConfig))
    const serverProxyRoutes = [
      '/graphql',
      '/auth',
      '/oauth2',
      '/health',
      '/github',
      '/docs',
      '/artifacts',
      '/api',
      '/socket.io',
    ]
    const devServer = new WebpackDevServer(
      {
        historyApiFallback: true,
        hot: true,
        port: 8080,
        compress: true,
        proxy: serverProxyRoutes.map((route) => ({
          path: route,
          target: process.env.PERFSEE_PLATFORM_HOST ?? 'http://localhost:3000',
        })),
      },
      compiler,
    )
    await devServer.start()
    return new Promise(() => {})
  })
}

export function runWebpack(
  { entry, project }: { entry: string; project: string },
  mode: 'production' | 'development' = 'development',
  externalConfig: webpack.Configuration = {},
) {
  const mergedConfig = merge(
    config(),
    {
      mode,
      entry,
      output: {
        path: join(rootPath, 'dist', project),
        filename: '[name].[contenthash:8].js',
        chunkFilename: '[name].[contenthash:8].js',
      },
    },
    externalConfig,
  )

  if (mode === 'development') {
    return Promise.all([watchRoutes(), watchGraphqlSchema])
      .then(() => {
        return new Promise(() => {
          webpack(mergedConfig).watch({}, (_, stats) => {
            // eslint-disable-next-line no-console
            console.log(stats?.toString({ colors: true }))
          })
        })
      })
      .catch((e) => {
        console.error(e)
      })
  }

  return new Promise<void>((resolve, reject) => {
    webpack(mergedConfig).run((err, stats) => {
      if (err) {
        reject(err)
        return
      }
      console.info(stats!.toString({ colors: true }))
      resolve()
    })
  })
}
