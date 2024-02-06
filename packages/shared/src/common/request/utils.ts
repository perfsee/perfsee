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

import { isObject, isNil } from 'lodash'

import { RequestBody } from './types'

const isFile = (value: any) => value instanceof File

export function appendFormData(body: RequestBody, files: File[]) {
  const form = new FormData()

  if (body.operationName) {
    form.append('operationName', body.operationName)
  }
  form.append('query', body.query)
  form.append('variables', JSON.stringify(body.variables))
  files.forEach((file) => {
    form.append(file.name, file)
  })

  body.form = form
}

export function filterEmptyValue(obj: any) {
  const newObj = {}
  Object.entries(obj).forEach(([key, value]) => {
    if (isNil(value)) {
      return
    }
    if (isObject(value) && !isFile(value)) {
      newObj[key] = filterEmptyValue(value)
      return
    }
    newObj[key] = value
  })

  return newObj
}
