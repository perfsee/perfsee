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

import { parse } from 'acorn'
import { recursive } from 'acorn-walk'
import { Node, FunctionDeclaration, FunctionExpression, ArrowFunctionExpression } from 'estree'

interface State {
  functionStacks: { isAsync: boolean }[]
  foundTopLevelAwait: boolean
}
const visit = recursive as unknown as <TState>(
  ast: Node,
  state: TState,
  visitor: {
    [K in Node['type']]?: (
      node: Extract<Node, { type: K }>,
      state: TState,
      callback: (node: Node, state: TState) => void,
    ) => void
  },
) => void

export const hasTopLevelAwait = (code: string) => {
  const ast = parse(code, {
    ecmaVersion: 'latest',
    sourceType: 'module',
  }) as Node

  const walkState: State = {
    functionStacks: [],
    foundTopLevelAwait: false,
  }

  const functionVisitor = (
    node: FunctionDeclaration | FunctionExpression | ArrowFunctionExpression,
    state: State,
    callback: (node: Node, state: State) => void,
  ) => {
    if (state.foundTopLevelAwait) {
      return
    }
    node.params.forEach((p) => callback(p, state))
    state.functionStacks.push({ isAsync: !!node.async })
    callback(node.body, state)
    state.functionStacks.pop()
  }

  visit(ast, walkState, {
    AwaitExpression(_node, state) {
      if (!state.functionStacks.slice(-1)?.[0]?.isAsync) {
        state.foundTopLevelAwait = true
      }
    },
    FunctionDeclaration: functionVisitor,
    FunctionExpression: functionVisitor,
    ArrowFunctionExpression: functionVisitor,
  })

  return walkState.foundTopLevelAwait
}
