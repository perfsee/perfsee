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

import { Option } from 'clipanion'

import { getPackage } from '../utils'
import { getVscodeExtensionConfig, getVscodeExtensionWebViewConfig } from '../webpack/vscode-extension-config'
import { runWebpack } from '../webpack/webpack.config'

import { Command } from './command'

export class VscodeExtensionCommand extends Command {
  static paths = [['vscode']]

  mode: string = Option.String()

  async execute() {
    if (
      this.mode !== 'watch' &&
      this.mode !== 'build' &&
      this.mode !== 'watch:webview' &&
      this.mode !== 'build:webview'
    ) {
      throw new Error('mode must be one of "watch", "build", "watch:webview", "build:webview"')
    }

    const webpackMode = this.mode.startsWith('watch') ? 'development' : 'production'

    process.env.NODE_ENV = process.env.NODE_ENV ?? webpackMode

    const pkg = getPackage('perfsee-vscode')

    if (!this.mode.endsWith('webview')) {
      await runWebpack(
        { entry: pkg.relative('src', 'extension.ts'), project: 'vscode-extension' },
        webpackMode,
        getVscodeExtensionConfig(webpackMode, pkg.distPath),
      )
    } else {
      await runWebpack(
        {
          entry: pkg.relative('src', 'webview', 'index.tsx'),
          project: 'vscode-extension',
        },
        webpackMode,
        getVscodeExtensionWebViewConfig(webpackMode, pkg.distPath),
      )
    }
  }
}
