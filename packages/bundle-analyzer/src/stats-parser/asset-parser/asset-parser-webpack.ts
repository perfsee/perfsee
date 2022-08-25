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
import {
  ArrayExpression,
  Expression,
  Node,
  ObjectExpression,
  SimpleCallExpression,
  VariableDeclaration,
  CallExpression,
  FunctionExpression,
} from 'estree'

type LocationMap = Map<string | number, { start: number; end: number }>
interface State {
  locations: LocationMap | null
  expressionStatementDepth: number
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

export function parseAssetModules(content: string): Map<string | number, string> {
  const ast = parse(content, {
    sourceType: 'module',
    ecmaVersion: 'latest' as any,
  }) as Node

  const walkState: State = {
    locations: null,
    expressionStatementDepth: 0,
  }

  visit(ast, walkState, {
    ExpressionStatement(node, state, callback) {
      if (state.locations) return

      state.expressionStatementDepth++

      if (
        // Webpack 5 stores modules in the the top-level IIFE
        state.expressionStatementDepth === 1 &&
        (ast as any).body?.includes(node) &&
        isIIFE(node)
      ) {
        const fn = getIIFECallExpression(node.expression)

        if (
          // It should not contain neither arguments
          fn.arguments.length === 0 &&
          // ...nor parameters
          (fn.callee as FunctionExpression).params.length === 0
        ) {
          // Modules are stored in the very first variable declaration as hash
          const firstVariableDeclaration = (fn.callee as FunctionExpression).body.body.find(
            (node: any) => node.type === 'VariableDeclaration',
          ) as VariableDeclaration

          if (firstVariableDeclaration) {
            for (const declaration of firstVariableDeclaration.declarations) {
              if (declaration.init) {
                state.locations = getModulesLocations(declaration.init)

                if (state.locations) {
                  break
                }
              }
            }
          }
        }
      }

      if (!state.locations) {
        if (node.expression.type === 'AssignmentExpression' && node.expression.right.type === 'CallExpression') {
          callback(node.expression.right, state)
        } else {
          callback(node.expression, state)
        }
      }

      state.expressionStatementDepth--
    },
    AssignmentExpression(node, state) {
      if (state.locations) return

      // Modules are stored in exports.modules:
      // exports.modules = {};
      const { left, right } = node

      if (
        left.type === 'MemberExpression' &&
        left.object.type === 'Identifier' &&
        left.object.name === 'exports' &&
        left.property &&
        left.property.type === 'Identifier' &&
        left.property.name === 'modules' &&
        isModulesHash(right)
      ) {
        state.locations = getModulesLocations(right)
      }
    },
    CallExpression(node, state, callback) {
      if (state.locations) return

      const args = node.arguments as Expression[]

      // Main chunk with webpack loader.
      // Modules are stored in first argument:
      // (function (...) {...})(<modules>)
      if (
        ((node.callee.type === 'FunctionExpression' && !node.callee.id) ||
          node.callee.type === 'ArrowFunctionExpression') &&
        args.length === 1 &&
        isSimpleModulesList(args[0])
      ) {
        state.locations = getModulesLocations(args[0])
        return
      }

      // Main chunk with webpack loader.
      // Modules are inlined inside runtime code:
      // (() => { var r = {...} })()
      // !(function () { var r = {} })()
      if (
        ((node.callee.type === 'FunctionExpression' && !node.callee.id) ||
          node.callee.type === 'ArrowFunctionExpression') &&
        args.length === 0 &&
        node.callee.body.type === 'BlockStatement'
      ) {
        const body = node.callee.body.body
        if (Array.isArray(body)) {
          const declaration = body.find((node) => node.type === 'VariableDeclaration') as
            | VariableDeclaration
            | undefined
          const modulesDeclaration = declaration?.declarations.find((d) => d.init && isSimpleModulesList(d.init))
          if (modulesDeclaration) {
            state.locations = getModulesLocations(modulesDeclaration.init!)
            return
          }
        }
      }

      // Async Webpack < v4 chunk without webpack loader.
      // webpackJsonp([<chunks>], <modules>, ...)
      // As function name may be changed with `output.jsonpFunction` option we can't rely on it's default name.
      if (node.callee.type === 'Identifier' && mayBeAsyncChunkArguments(args) && isModulesList(args[1])) {
        state.locations = getModulesLocations(args[1])
        return
      }

      // Async Webpack v4 chunk without webpack loader.
      // (window.webpackJsonp=window.webpackJsonp||[]).push([[<chunks>], <modules>, ...]);
      // As function name may be changed with `output.jsonpFunction` option we can't rely on it's default name.
      if (isAsyncChunkPushExpression(node)) {
        state.locations = getModulesLocations((args[0] as ArrayExpression).elements[1])
        return
      }

      // Webpack v4 WebWorkerChunkTemplatePlugin
      // globalObject.chunkCallbackName([<chunks>],<modules>, ...);
      // Both globalObject and chunkCallbackName can be changed through the config, so we can't check them.
      if (isAsyncWebWorkerChunkExpression(node)) {
        state.locations = getModulesLocations(args[1])
        return
      }

      // Walking into arguments because some of plugins (e.g. `DedupePlugin`) or some Webpack
      // features (e.g. `umd` library output) can wrap modules list into additional IIFE.
      args.forEach((arg) => {
        callback(arg, state)
      })
    },
  })

  const result = new Map<string | number, string>()

  if (walkState.locations) {
    for (const [id, { start, end }] of walkState.locations) {
      result.set(id, content.slice(start, end))
    }
  }

  return result
}

function isModulesList(node: Node | null) {
  return (
    isSimpleModulesList(node) ||
    // Modules are contained in expression `Array([minimum ID]).concat([<module>, <module>, ...])`
    isOptimizedModulesArray(node)
  )
}

function isSimpleModulesList(node: Node | null) {
  return (
    // Modules are contained in hash. Keys are module ids.
    isModulesHash(node) ||
    // Modules are contained in array. Indexes are module ids.
    isModulesArray(node)
  )
}

function isModulesHash(node: Node | null): node is ObjectExpression {
  return (
    node?.type === 'ObjectExpression' &&
    node.properties.every((p) => {
      return p.type === 'Property' && isModuleWrapper(p.value as Expression)
    })
  )
}

function isModulesArray(node: Node | null) {
  return (
    node?.type === 'ArrayExpression' &&
    // Some of array items may be skipped because there is no module with such id
    node.elements.every((elem) => !elem || isModuleWrapper(elem as Expression))
  )
}

function isOptimizedModulesArray(node: Node | null) {
  // Checking whether modules are contained in `Array(<minimum ID>).concat(...modules)` array:
  // https://github.com/webpack/webpack/blob/v1.14.0/lib/Template.js#L91
  // The `<minimum ID>` + array indexes are module ids
  return (
    node?.type === 'CallExpression' &&
    node.callee.type === 'MemberExpression' &&
    // Make sure the object called is `Array(<some number>)`
    node.callee.object.type === 'CallExpression' &&
    node.callee.object.callee.type === 'Identifier' &&
    node.callee.object.callee.name === 'Array' &&
    node.callee.object.arguments.length === 1 &&
    isNumericId(node.callee.object.arguments[0]) &&
    // Make sure the property X called for `Array(<some number>).X` is `concat`
    node.callee.property.type === 'Identifier' &&
    node.callee.property.name === 'concat' &&
    // Make sure exactly one array is passed in to `concat`
    node.arguments.length === 1 &&
    isModulesArray(node.arguments[0])
  )
}

function isModuleWrapper(node: Expression) {
  const result =
    // It's an anonymous function expression that wraps module
    // eslint-disable-next-line sonarjs/prefer-immediate-return
    (node.type === 'FunctionExpression' && !node.id) ||
    node.type === 'ArrowFunctionExpression' ||
    // If `DedupePlugin` is used it can be an ID of duplicated module...
    isModuleId(node) ||
    // or an array of shape [<module_id>, ...args]
    (node.type === 'ArrayExpression' && node.elements.length > 1 && isModuleId(node.elements[0]))

  return result
}

function isModuleId(node: Node | null) {
  return node?.type === 'Literal' && (isNumericId(node) || typeof node.value === 'string')
}

function isNumericId(node: Node) {
  return node.type === 'Literal' && Number.isInteger(node.value) && (node.value as number) >= 0
}

function isChunkIds(node: Node) {
  // Array of numeric or string ids. Chunk IDs are strings when NamedChunksPlugin is used
  return node.type === 'ArrayExpression' && node.elements.every(isModuleId)
}

function isAsyncChunkPushExpression(node: SimpleCallExpression) {
  const { callee, arguments: args } = node

  return (
    callee.type === 'MemberExpression' &&
    'name' in callee.property &&
    callee.property.name === 'push' &&
    callee.object.type === 'AssignmentExpression' &&
    args.length === 1 &&
    args[0].type === 'ArrayExpression' &&
    mayBeAsyncChunkArguments(args[0].elements as Expression[]) &&
    isModulesList(args[0].elements[1])
  )
}

function mayBeAsyncChunkArguments(args: Expression[]) {
  return args.length >= 2 && isChunkIds(args[0])
}

function isAsyncWebWorkerChunkExpression(node: SimpleCallExpression) {
  const { callee, arguments: args } = node

  return callee.type === 'MemberExpression' && args.length === 2 && isChunkIds(args[0]) && isModulesList(args[1])
}

function getModulesLocations(node: Node | null) {
  const locations: LocationMap = new Map()
  if (node?.type === 'ObjectExpression') {
    // Modules hash
    node.properties.forEach((node) => {
      if (!('key' in node)) {
        return
      }

      // @ts-expect-error
      const moduleId = node.key.name || node.key.value
      locations.set(moduleId, getModuleLocation(node.value))
    })
  }

  if (node?.type === 'ArrayExpression' || node?.type === 'CallExpression') {
    // Modules array or optimized array
    const minId: number =
      node.type === 'CallExpression'
        ? // Get the [minId] value from the Array() call first argument literal value
          // @ts-expect-error
          node.callee.object.arguments[0].value
        : // `0` for simple array
          0
    const modulesNodes =
      node.type === 'CallExpression'
        ? // The modules reside in the `concat()` function call arguments
          // @ts-expect-error
          node.arguments[0].elements
        : node.elements

    modulesNodes.forEach((node: Node, i: number) => {
      if (!node) {
        return
      }

      locations.set(i + minId, getModuleLocation(node))
    })
  }

  return locations
}

function getModuleLocation(node: any) {
  return {
    start: node.start,
    end: node.end,
  }
}

function isIIFE(node: Node) {
  return (
    node.type === 'ExpressionStatement' &&
    (node.expression.type === 'CallExpression' ||
      (node.expression.type === 'UnaryExpression' && node.expression.argument.type === 'CallExpression'))
  )
}

function getIIFECallExpression(expression: Expression): CallExpression {
  if (expression.type === 'UnaryExpression') {
    return expression.argument as CallExpression
  } else {
    return expression as CallExpression
  }
}
