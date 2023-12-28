import { useCallback, useEffect, useState } from 'react'

import { ProfileFileSearchEngine, ProfileNameSearchEngine, ProfileSearchEngine } from '../lib/profile-search'
import { Theme } from '../themes/theme'

interface Props {
  onSearch: (searchResults: ProfileSearchEngine | null) => void
  onClose: () => void
  theme: Theme
  style?: React.CSSProperties
}
export const searchBoxStyles = {
  position: 'absolute',
  right: '0px',
  top: '0px',
  zIndex: 10,
} as React.CSSProperties
export const searchHint = (
  <span style={{ ...searchBoxStyles, color: '#7a7574', fontSize: 12 }}>Ctrl/Command + F to search</span>
)

export const SearchBox: React.FC<Props> = ({ onSearch, onClose, theme, style }) => {
  const [queryText, setQueryText] = useState<string>()
  const [queryMode, setQueryMode] = useState<string>('name')

  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQueryText(e.target.value)
  }, [])

  const handleSelectMode = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setQueryMode(e.target.value)
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => {
      const Engine = queryMode === 'file' ? ProfileFileSearchEngine : ProfileNameSearchEngine
      onSearch(queryText ? new Engine(queryText) : null)
    }, 300)
    return () => clearTimeout(timeout)
  }, [onSearch, queryMode, queryText])

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        padding: '8px',
        boxShadow: '0px 2px 6px rgba(0,0,0,0.2)',
        background: theme.bgPrimaryColor,
        border: '1px solid ' + theme.borderColor,
        color: theme.fgPrimaryColor,
        ...style,
      }}
    >
      <svg width="18" viewBox="0 0 24 24" style={{ marginRight: '4px' }}>
        <path
          d="M20.71 19.29l-3.4-3.39A7.92 7.92 0 0 0 19 11a8 8 0 1 0-8 8 7.92 7.92 0 0 0 4.9-1.69l3.39 3.4a1 1 0 0 0 1.42 0 1 1 0 0 0 0-1.42zM5 11a6 6 0 1 1 6 6 6 6 0 0 1-6-6z"
          fill="currentColor"
        />
      </svg>
      <input
        autoFocus
        onChange={handleInput}
        value={queryText}
        placeholder="Search"
        style={{
          border: 'none',
          outline: 'none',
          background: 'transparent',
        }}
      />
      <select
        value={queryMode}
        onChange={handleSelectMode}
        style={{
          border: 'none',
          outline: 'none',
          background: 'transparent',
          color: theme.fgPrimaryColor,
          fontSize: '0.8em',
          opacity: 0.5,
          margin: '0 4px',
        }}
      >
        <option value="name">Name</option>
        <option value="file">File</option>
      </select>
      <svg
        width="18"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        role="button"
        style={{ marginLeft: '4px', cursor: 'pointer' }}
        onClick={onClose}
      >
        <path
          d="M13.41 12l4.3-4.29a1 1 0 1 0-1.42-1.42L12 10.59l-4.29-4.3a1 1 0 0 0-1.42 1.42l4.3 4.29-4.3 4.29a1 1 0 0 0 0 1.42 1 1 0 0 0 1.42 0l4.29-4.3 4.29 4.3a1 1 0 0 0 1.42 0 1 1 0 0 0 0-1.42z"
          fill={theme.fgSecondaryColor}
        />
      </svg>
    </div>
  )
}

export const useSearchBoxShortcut = (onOpen: () => void, onClose: () => void, disabled: boolean) => {
  useEffect(() => {
    if (disabled) return
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'F3' || ((e.ctrlKey || e.metaKey) && e.code === 'KeyF')) {
        e.preventDefault()
        onOpen()
      }
      if (e.code === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onOpen, onClose, disabled])
}
