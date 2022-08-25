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

import {
  Stack,
  DefaultButton,
  IconButton,
  IIconProps,
  IButtonStyles,
  IStackTokens,
  Dropdown,
  IDropdownOption,
} from '@fluentui/react'
import { range } from 'lodash'
import { memo, FC, useState, useCallback, useMemo, MouseEvent } from 'react'

export interface PageInfo {
  pageSize: number
  page: number
}

interface Props {
  total: number
  onChange: (page: number, pageSize: number) => void
  defaultPage?: number
  defaultPageSize?: number
  page?: number
  pageSize?: number
  pageSizeOptions?: number[]
  showSizeChanger?: boolean
  hideOnSinglePage?: boolean
  disabled?: boolean
}

const prevIcon: IIconProps = { iconName: 'LeftOutlined' }
const nextIcon: IIconProps = { iconName: 'RightOutlined' }
const pageButtonStyles: IButtonStyles = { root: { borderColor: 'transparent', minWidth: 32, padding: '0 4px' } }
const stackTokens: IStackTokens = { childrenGap: 4 }

const PaginationComponent: FC<Props> = (props) => {
  const {
    pageSize: pageSizeFromProps,
    page: pageFromProps,
    onChange,
    pageSizeOptions: pageSizeOptionsFromProps,
    disabled,
    hideOnSinglePage,
    showSizeChanger,
    defaultPage,
    defaultPageSize,
    total,
  } = props

  const [pageSize, setPageSize] = useState(defaultPageSize ?? 10)
  const [page, setPage] = useState(defaultPage ?? 1)

  // getDerivedStatFromProps
  if (pageFromProps && pageFromProps !== page) {
    setPage(pageFromProps)
  }

  if (pageSizeFromProps && pageSizeFromProps !== pageSize) {
    setPageSize(pageSizeFromProps)
  }

  const pageSizeOptions = useMemo<IDropdownOption[]>(() => {
    return (pageSizeOptionsFromProps ?? [10, 20, 50, 100]).map((pageSize) => ({
      key: pageSize,
      text: `${pageSize} / page`,
    }))
  }, [pageSizeOptionsFromProps])

  const onPageClick = useCallback(
    (e: MouseEvent<any> | number) => {
      const newPage =
        typeof e === 'number' ? e : e.currentTarget.dataset.page ? parseInt(e.currentTarget.dataset.page) : 0
      if (newPage <= 0) {
        return
      }
      if (page === newPage) {
        return
      }

      if (!pageFromProps) {
        setPage(newPage)
      }

      onChange(newPage, pageSize)
    },
    [page, onChange, pageFromProps, pageSize],
  )

  const onPreviousPage = useCallback(() => {
    onPageClick(page - 1)
  }, [page, onPageClick])

  const onNextPage = useCallback(() => {
    onPageClick(page + 1)
  }, [page, onPageClick])

  const onChangePageSize = useCallback(
    (_: any, option?: IDropdownOption) => {
      if (option) {
        const newPageSize = option.key as number
        if (newPageSize === pageSize) {
          return
        }

        if (!pageSizeFromProps) {
          setPageSize(newPageSize)
        }

        // page may overflow
        const newPage = Math.min(page, Math.ceil(total / newPageSize))
        if (newPage !== page && !pageFromProps) {
          setPage(newPage)
        }

        onChange(newPage, option.key as number)
      }
    },
    [onChange, page, pageSizeFromProps, pageFromProps, total, setPageSize, pageSize, setPage],
  )

  const pageNum = Math.ceil(total / pageSize)
  if (pageNum < 2 && hideOnSinglePage) {
    return null
  }

  let startPage = Math.max(1, page - 2)
  let endPage = Math.min(pageNum, page + 2)
  if (page <= 2) {
    endPage = Math.min(pageNum, startPage + 4)
  } else if (endPage > pageNum - 2) {
    startPage = Math.max(1, endPage - 4)
  }

  return (
    <Stack horizontal={true} verticalAlign="center" tokens={stackTokens}>
      <IconButton iconProps={prevIcon} disabled={disabled ?? page === 1} onClick={onPreviousPage} />
      {range(startPage, endPage + 1).map((p) => (
        <DefaultButton
          key={p}
          primary={p === page}
          disabled={disabled}
          styles={pageButtonStyles}
          onClick={onPageClick}
          data-page={p}
        >
          {p}
        </DefaultButton>
      ))}
      <IconButton iconProps={nextIcon} disabled={disabled ?? page === pageNum} onClick={onNextPage} />
      {showSizeChanger && (
        <Dropdown
          placeholder="Page Size"
          defaultSelectedKey={pageSize}
          options={pageSizeOptions}
          onChange={onChangePageSize}
        />
      )}
    </Stack>
  )
}

export const Pagination = memo(PaginationComponent)
