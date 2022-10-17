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

import fs from 'fs'
import path from 'path'

import { watch } from 'chokidar'
import { load } from 'js-yaml'
import { parse, Token } from 'path-to-regexp'

import { getPackage, logger, prettier } from '../utils'

const routesDef = getPackage('@perfsee/shared').relative('src', 'routes', 'router.yaml')
const output = path.join(routesDef, '../', path.parse(routesDef).name + '.ts')

const template = `import { compile, PathFunctionOptions } from 'path-to-regexp'

type PathMaker<Params, Required extends boolean> = Required extends true
  ? (paramsMap: Params, options?: PathFunctionOptions) => string
  : (paramsMap?: Params, options?: PathFunctionOptions) => string

type Params<K extends string, V = string> = { [key in K]: V }
type FactoryParams<T> = { [key in keyof T]: T[key] | number }

function makePathsFrom<Params = void>(path: string) {
  // https://github.com/pillarjs/path-to-regexp#compile-reverse-path-to-regexp
  return compile(path) as PathMaker<Params, Params extends void ? false : true>
}

function makeTitlesFrom(title: string, data: Record<string, any>) {
  return title.replace(/\\{(.*?)\\}/g, (match, key) => data[key] ?? match)
}
`

interface YamlSchema {
  base: string
  title?: string
  paths: {
    [key: string]:
      | {
          path: string
          title?: string
        }
      | YamlSchema
  }
}

interface TokenSchema {
  [key: string]:
    | {
        path: string
        tokens: Token[]
      }
    | {
        children: TokenSchema
      }
}

/**
 * routeJoin('/path/to?abc=xyz', '/somewhere?foo=bar') // /path/to/somewhere?abc=xyz&foo=bar
 */
function routeJoin(a: string, b: string) {
  const [aBase, aQuery] = a.split('\\?')
  const [bBase, bQuery] = b.split('\\?')

  const base = `${aBase}/${bBase}`.replace(/\/+/g, '/')

  let query
  if (aQuery) {
    query = aQuery
    if (bQuery) {
      query += '&' + bQuery
    }
  } else {
    query = ''
    if (bQuery) {
      query += bQuery
    }
  }

  return base + (query ? `\\?${query}` : '')
}

function titleJoin(a?: string, b?: string) {
  if (!a?.trim() || !b?.trim()) {
    return a ?? b ?? ''
  }
  return `${a} | ${b}`
}

function buildTitleFunction(title: string) {
  if (!title.trim()) {
    return `() => ''`
  }

  return `(data: Record<string, any>) => makeTitlesFrom('${title}', data)`
}

function getTypeString(tokens: Token[]): string {
  const required: string[] = []
  const optional: string[] = []
  tokens.forEach((token) => {
    if (typeof token === 'string') {
      return
    }

    if (token.optional) {
      optional.push(`'${token.name}'`)
    } else {
      required.push(`'${token.name}'`)
    }
  })

  let type = 'void'

  if (required.length) {
    type = `Params<${required.join('|')}>`
  }
  if (optional.length) {
    const optionalType = `Partial<Params<${optional.join('|')}>>`
    if (required.length) {
      type = `${type} & ${optionalType}`
    } else {
      type = optionalType
    }
  }
  return type
}

export function codeStringify(code: Record<string, unknown>): string {
  const replaceInfo: { origin: string; stringified: string }[] = []
  const stringifiedCode = JSON.stringify(code, collectReplaceInfo)

  return replaceInfo.reduce(
    // '{ "key": "value" }' => '{ "key": value }'
    (result, { origin, stringified }) => result.replace(stringified, origin),
    stringifiedCode,
  )

  function collectReplaceInfo(_key: string, value: string | Record<string, unknown>) {
    if (typeof value === 'string') {
      replaceInfo.push({
        origin: value,
        stringified: JSON.stringify(value),
      })
    }

    return value
  }
}

function loadYaml(filePath: string) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Routes definition file '${filePath}' does not exist.`)
  }

  return load(fs.readFileSync(filePath, 'utf8')) as YamlSchema
}

function serializeSchema(schema: YamlSchema, parent = ''): TokenSchema {
  const basePath = routeJoin(parent, schema.base)
  return {
    home: {
      path: basePath,
      tokens: parse(basePath),
    },
    ...Object.entries(schema.paths).reduce((acc, [key, value]) => {
      if (value['path']) {
        const path = routeJoin(basePath, value['path'])
        acc[key] = {
          path,
          tokens: parse(path),
        }
      } else {
        acc[key] = {
          children: serializeSchema(value as YamlSchema, basePath),
        }
      }

      return acc
    }, {}),
  }
}

function stringifyRoutes(rootSchema: TokenSchema, parentPaths: string[] = []) {
  const routeTypes = {}
  const staticPath = {}
  const pathFactory = {}

  Object.keys(rootSchema).forEach((key) => {
    const paths = [...parentPaths, key]
    const schema = rootSchema[key]
    if ('path' in schema) {
      routeTypes[key] = getTypeString(schema.tokens)
      staticPath[key] = JSON.stringify(schema.path.split('\\?')[0])
      const accessor = paths.reduce((prev, next) => `${prev}['${next}']`, '')
      pathFactory[key] = `makePathsFrom<FactoryParams<RouteTypes${accessor}>>(${JSON.stringify(schema.path)})`
    } else {
      const childrenResult = stringifyRoutes(schema.children, paths)
      routeTypes[key] = childrenResult.routeTypes
      staticPath[key] = childrenResult.staticPaths
      pathFactory[key] = childrenResult.pathFactory
    }
  })

  return { routeTypes, staticPaths: staticPath, pathFactory }
}

function serializeTitles(schema: YamlSchema, parent = '', parentPath = '') {
  const baseTitle = titleJoin(schema.title, parent)
  const basePath = routeJoin(parentPath, schema.base)

  return {
    [basePath]: buildTitleFunction(baseTitle),
    ...Object.entries(schema.paths).reduce((acc, [_, value]) => {
      if (value['path']) {
        const path = routeJoin(basePath, value['path'])
        const title = titleJoin(value.title, baseTitle)
        acc[path] = buildTitleFunction(title)
      } else {
        for (const [k, v] of Object.entries(serializeTitles(value as YamlSchema, baseTitle, basePath))) {
          acc[k] = v
        }
      }

      return acc
    }, {}),
  }
}

export async function generateRoutes() {
  return new Promise<void>((resolve, reject) => {
    const schema = loadYaml(routesDef)
    const tokenSchema = serializeSchema(schema)
    const { routeTypes, staticPaths, pathFactory } = stringifyRoutes(tokenSchema)

    const titles = serializeTitles(schema)

    const result = `${template}

  export interface RouteTypes ${codeStringify(routeTypes)}

  export const staticPath = ${codeStringify(staticPaths)}

  export const pathFactory = ${codeStringify(pathFactory)}

  export const titleFactory = ${codeStringify(titles)}
  `
    fs.writeFile(output, prettier(result), (err) => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
    logger.info('Router schema generated')
  })
}

export async function watchRoutes() {
  return new Promise<() => void>((resolve, reject) => {
    const watcher = watch(routesDef)
    const close = () => {
      watcher.close().catch(() => {})
    }

    watcher
      .on('ready', () => {
        generateRoutes()
          .then(() => {
            resolve(close)
          })
          .catch((e) => {
            close()
            reject(e)
          })
      })
      .on('change', () => {
        generateRoutes().catch((err) => {
          console.error('Failed to generate routes')
          console.error(err)
        })
      })
  })
}
