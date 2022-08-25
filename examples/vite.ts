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

import { build } from 'vite'

import { PerfseePlugin } from '@perfsee/rollup'

export const runVite = async (root: string): Promise<any> => {
  return build({
    root,
    plugins: [PerfseePlugin({ failIfNotPass: true })],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id: string, { getModuleInfo }) {
            if (id.match(/[\\/]node_modules[\\/]/)) {
              return getModuleInfo(id)?.dynamicImporters.length ? 'vendor-async' : 'vendor'
            }
            if (id.match(/[\\/]src[\\/]/)) {
              return getModuleInfo(id)?.dynamicImporters.length ? 'async-component' : 'index'
            }
            if (id.match(/[\\/]node_modules[\\/](antd|@ant-design|rc-[^\\/]+)[\\/]/)) {
              return 'antd'
            }
            if (id.match(/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/)) {
              return 'react'
            }
          },
        },
      },
    },
  })
}
