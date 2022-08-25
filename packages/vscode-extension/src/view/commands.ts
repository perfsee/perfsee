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

import { commands } from 'vscode'

import { CommandHanlderMap, Commands } from '../constants'
import Logger from '../utils/logger'

type WrapPromiseReturn<T> = T extends (...arg: infer V) => infer P ? (...args: V) => Promise<P> : never
type MaybeParams<T> = T extends (...arg: infer V) => infer P
  ? (...args: { [K in keyof V]: V[K] | null | undefined }) => P
  : never

export function registerCommand<TCommand extends Commands>(
  command: TCommand,
  handler: MaybeParams<CommandHanlderMap[TCommand]> | WrapPromiseReturn<MaybeParams<CommandHanlderMap[TCommand]>>,
) {
  return commands.registerCommand(command, (...args) => {
    try {
      return (handler as any)(...args)
    } catch (err) {
      Logger.err(`Command ${command} execute error: \n`, err)
      return null
    }
  })
}

type Parameter<T> = T extends (...arg: infer V) => any ? V : never
type First<T extends any[]> = T[0]
type EnsureLength<T, L> = T extends { length: L } ? T : never

export function createCommandMarkdownLink<TCommand extends Commands>(
  command: TCommand,
  options: First<EnsureLength<Parameter<CommandHanlderMap[TCommand]>, 1>>,
) {
  return `command:${command}?${encodeURIComponent(JSON.stringify(options))}`
}

export function executeCommand<TCommand extends Commands>(
  command: TCommand,
  ...args: Parameter<CommandHanlderMap[TCommand]>
) {
  return commands.executeCommand(command, ...args) as Promise<ReturnType<CommandHanlderMap[TCommand]> | null>
}

export function createTreeViewItemCommand<TCommand extends Commands>(
  title: string,
  command: TCommand,
  ...args: Parameter<CommandHanlderMap[TCommand]>
) {
  return {
    title: title,
    command: command,
    arguments: args,
  }
}
