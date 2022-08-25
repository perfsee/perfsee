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

import { EMAIL_REGEXP } from '@perfsee/shared'

export const isNonEmpty = (value?: string) => {
  if (!value) {
    return 'Required'
  }
}

export const isValidateURL = (url: string) => {
  try {
    new URL(url)
  } catch (e) {
    return false
  }
  return true
}

export const isNonEmptyUrl = (url?: string) => {
  if (!url) {
    return 'Required'
  }

  if (!isValidateURL(url)) {
    return 'Invalid URL.'
  }
}

export const isValidEmail = (email: string) => {
  return EMAIL_REGEXP.test(email)
}
