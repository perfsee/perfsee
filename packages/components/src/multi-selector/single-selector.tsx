import { omit } from 'lodash'
import { useCallback } from 'react'

import { CommonProps, MultiSelector } from './index'

interface Props<T> extends CommonProps<T> {
  defaultId?: T
  id?: T
  onSelectChange?: (id: T) => void
}
export const SingleSelector = <T,>(props: Props<T>) => {
  const onSelectChange = useCallback((ids: T[]) => props?.onSelectChange?.(ids[0]), [props])

  return (
    <MultiSelector
      {...omit(props, 'defaultId', 'onSelectChange', 'id')}
      multiSelect={false}
      defaultIds={props.defaultId ? [props.defaultId] : undefined}
      ids={props.id ? [props.id] : []}
      onSelectChange={onSelectChange}
    />
  )
}
