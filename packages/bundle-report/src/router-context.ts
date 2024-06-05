import { createContext } from 'react'
import type { useHistory, useLocation } from 'react-router'

export const RouterContext = createContext<{
  location?: ReturnType<typeof useLocation>
  history?: ReturnType<typeof useHistory>
}>({})
