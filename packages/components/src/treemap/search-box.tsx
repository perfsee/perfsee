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

import { CloseOutlined, SearchOutlined } from '@ant-design/icons'
import styled from '@emotion/styled'
import { useCallback, useEffect, useState } from 'react'

import { SharedColors } from '@perfsee/dls'

interface Props {
  onSearch: (query: string | null) => void
  onClose: () => void
  className?: string
}

export const SearchBox: React.FC<Props> = ({ onSearch, onClose, className }) => {
  const [queryText, setQueryText] = useState<string>()

  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQueryText(e.target.value)
  }, [])

  useEffect(() => {
    onSearch(queryText ?? null)
  }, [onSearch, queryText])

  return (
    <Container className={className}>
      <SearchIcon />
      <QueryInput autoFocus onChange={handleInput} value={queryText} placeholder="Search" />
      <CloseButton role="button" onClick={onClose} />
    </Container>
  )
}

export const useSearchBoxShortcut = (onOpen: () => void, onClose: () => void) => {
  useEffect(() => {
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
  }, [onOpen, onClose])
}

const Container = styled.div({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '8px',
  boxShadow: '0px 2px 6px rgba(0,0,0,0.2)',
  background: '#fff',
  border: '1px solid ' + SharedColors.gray10,
  color: '#000',
})

const QueryInput = styled.input({
  border: 'none',
  outline: 'none',
  background: 'transparent',
})

const CloseButton = styled(CloseOutlined)({
  marginLeft: '4px',
  cursor: 'pointer',
  fontSize: '14px',
  width: '14px',
  height: '14px',
  display: 'inline-block',
})

const SearchIcon = styled(SearchOutlined)({
  marginRight: '4px',
  fontSize: '14px',
  width: '14px',
  height: '14px',
  display: 'inline-block',
})
