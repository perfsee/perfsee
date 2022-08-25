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

const USER_ERROR_PREFIX = '[User Error]'

export class UserError extends Error {
  constructor(msg: string) {
    super(`${USER_ERROR_PREFIX} ${msg}`)
  }
}

export function isUserError(err: Error): boolean {
  return err instanceof UserError || err.message.startsWith(USER_ERROR_PREFIX)
}
