import { createContext } from 'react'
import type { useHistory, useLocation } from 'react-router'
import type { Link } from 'react-router-dom'

export const RouterContext = createContext<{
  location?: ReturnType<typeof useLocation>
  history?: ReturnType<typeof useHistory>
  Link?: typeof Link
}>({})
