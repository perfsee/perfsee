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

const localStorageKey = 'TEACHING_HISTORY'
const teachingHistory = new Set<string>(loadTeachingHistory())

function loadTeachingHistory() {
  try {
    const history = JSON.parse(localStorage.getItem(localStorageKey) ?? '')
    if (history instanceof Array) {
      return history
    } else {
      return []
    }
  } catch {
    return []
  }
}

function saveTeachingHistory(history: string[]) {
  localStorage.setItem(localStorageKey, JSON.stringify(history))
}

export function insertTeachingHistory(id: string) {
  if (!teachingHistory.has(id)) {
    teachingHistory.add(id)
    saveTeachingHistory(Array.from(teachingHistory))
  }
}

export function hasTeachingHistory(id: string) {
  return teachingHistory.has(id)
}
