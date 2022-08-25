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

const { join } = require('path')

module.exports = {
  entry: join(__dirname, 'src', process.env.ENTRY || 'index.tsx'),

  optimization: {
    splitChunks: {
      chunks: 'initial',
      minSize: 0,
      minChunks: 1,
      maxInitialRequests: Infinity,
      maxAsyncRequests: Infinity,
      cacheGroups: {
        'vendor-async': {
          name: 'vendor-async',
          test: /[\\/]node_modules[\\/]/,
          priority: 110,
          chunks: 'async',
        },
        'async-component': {
          name: 'async-component',
          test: /[\\/]src[\\/]/,
          priority: 110,
          chunks: 'async',
        },
        antd: {
          name: 'antd',
          test: /[\\/]node_modules[\\/](antd|@ant-design|rc-[^\\/]+)[\\/]/,
          priority: 100,
        },
        react: {
          name: 'react',
          test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
          priority: 100,
        },
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendor',
          priority: 90,
        },
      },
    },
  },
}
