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

const REACT_DOM_MODULE_REGEXP =
  /(?<moduleId>\w+|"\S+"):\s?(?<closure>(?:function\s?)?\(\w+,\w+,(?<getModule>\w+)\)\s?(?:=>)?\s?{(?:(?!((\w+|"\S+"):function\s?\(\w+,\w+,\w+)|react\.memo).)*?https:\/\/reactjs\.org\/docs\/error-decoder\.html.*rendererPackageName:\s?"react-dom".*?\w+\.version="(?<version>.*?)".*?})/

export function generateProfilingBundle(origin: string, profilingBuildText: string) {
  const profilingBuildGetModuleIdentifier = /^function\(\w+,\w+,(\w+)\)/.exec(profilingBuildText)?.[1]
  // ((?:var \w+)|(?:,\s?\w+))=n\((\d+|(?:".*?"))\)
  const profilingBuildGetModuleCallRegexp = new RegExp(
    `((?:var \\w+)|(?:,\\s?\\w+))=${profilingBuildGetModuleIdentifier}\\((\\d+|(?:".*?"))\\)`,
    'g',
  )
  return origin.replace(REACT_DOM_MODULE_REGEXP, (_match, moduleId, closure, getModuleIdentifier) => {
    const getModuleCallRegexp = new RegExp(
      `(?:(?:var \\w+)|(?:,\\s?\\w+))=${getModuleIdentifier}\\((\\d+|(?:".*?"))\\)`,
      'g',
    )
    const moduleIdReplacedText = profilingBuildText.replaceAll(
      profilingBuildGetModuleCallRegexp,
      (_match, variable) => {
        const moduleId = getModuleCallRegexp.exec(closure)?.[1]
        return `${variable}=${profilingBuildGetModuleIdentifier}(${moduleId})`
      },
    )
    return `${moduleId}:${moduleIdReplacedText}`
  })
}

export function detectReactDom(text: string) {
  return /rendererPackageName:\s?"react-dom"/.test(text)
}

export function isProfilingBuild(text: string) {
  return /injectProfilingHooks:/.test(text)
}
