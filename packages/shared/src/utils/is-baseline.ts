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

export const isBaselineRegex = (baseline?: string) => {
  if (!baseline) {
    return false
  }

  return baseline.startsWith('/') && baseline.endsWith('/') && baseline.length >= 2
}

export const convertRegex = (baseline: string) => {
  const str = baseline.slice(1, -1)

  try {
    return new RegExp(str)
  } catch {
    return false
  }
}

export const isBaseline = (branch: string, baselineBranch: string) => {
  if (!isBaselineRegex(baselineBranch)) {
    return branch === baselineBranch
  }

  const regex = convertRegex(baselineBranch)

  if (regex === false) {
    return branch === baselineBranch
  }

  return regex.test(branch)
}
