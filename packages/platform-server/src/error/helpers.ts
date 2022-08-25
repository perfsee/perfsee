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

import { HttpException, HttpStatus } from '@nestjs/common'

export function required<T>(value: T, ...keys: (keyof T)[]) {
  if (!value) {
    throw new HttpException(
      `Keys [${keys.join(',')}] is required in value, but value is ${value}`,
      HttpStatus.BAD_REQUEST,
    )
  }
  for (const key of keys) {
    if (value[key] == null) {
      throw new HttpException(`${String(key)} is required, but got ${value[key]}`, HttpStatus.BAD_REQUEST)
    }
  }
}

export const mapInternalError = (message: string) => (e: Error) => {
  throw createInternalError(message)(e)
}

export const createInternalError = (message: string) => (e: Error | Response) => {
  return new HttpException(
    `${message}: ${e instanceof Error ? e.message : e.statusText}`,
    HttpStatus.INTERNAL_SERVER_ERROR,
  )
}
