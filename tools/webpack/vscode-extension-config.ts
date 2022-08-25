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

import webpack from 'webpack'

export function getVscodeExtensionConfig(mode: NonNullable<webpack.Configuration['mode']>, outputPath: string) {
  return {
    mode,
    resolve: { mainFields: ['esnext', 'module', 'main'] },
    optimization: {
      splitChunks: false,
      runtimeChunk: false,
      nodeEnv: false,
    },
    target: 'node',
    node: false,
    externals: {
      vscode: 'commonjs vscode', // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed, 📖 -> https://webpack.js.org/configuration/externals/
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': `"${process.env.NODE_ENV ?? 'production'}"`,
      }),
    ],
    output: {
      path: outputPath,
      filename: 'extension.js',
      chunkFilename: '[name].js',
      libraryTarget: 'commonjs2',
    },
  } as webpack.Configuration
}

export function getVscodeExtensionWebViewConfig(mode: NonNullable<webpack.Configuration['mode']>, outputPath: string) {
  return {
    mode,
    resolve: { mainFields: ['esnext', 'browser', 'module', 'main'] },
    target: 'web',
    optimization: {
      splitChunks: false,
      runtimeChunk: false,
      nodeEnv: false,
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': `"${process.env.NODE_ENV ?? 'production'}"`,
      }),
    ],
    output: {
      path: outputPath,
      filename: 'webview.js',
      publicPath: '.',
    },
  } as webpack.Configuration
}
