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

import { useCallback, useEffect, useState } from 'react'

const localStorageKey = 'NAVBAR_COLLAPSED'

export const useNavType = () => {
  const [navCollapsed, setCollapsed] = useState(false)

  const updateLocalStorage = useCallback((collapsed: boolean) => {
    localStorage.setItem(localStorageKey, String(collapsed))
  }, [])

  const collapseNavbar = useCallback(() => {
    setCollapsed(true)
    updateLocalStorage(true)
  }, [])

  const expandNavbar = useCallback(() => {
    setCollapsed(false)
    updateLocalStorage(false)
  }, [])

  useEffect(() => {
    try {
      const collapsed = JSON.parse(localStorage.getItem(localStorageKey) ?? 'false')
      setCollapsed(collapsed)
    } catch {
      setCollapsed(false)
    }
  }, [])

  return [navCollapsed, collapseNavbar, expandNavbar] as const
}
