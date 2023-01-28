import { useDispatchers, useModuleState } from '@sigi/react'
import { useLayoutEffect } from 'react'

import { BreadcrumbModule } from './breadcrumb.module'

export * from './breadcrumb.module'

export type BreadcrumbItem = { text: string; href: string }

export const useBreadcrumb = () => {
  const { items } = useModuleState(BreadcrumbModule)

  return items
}

export const useUpdateBreadcrumb = (items: BreadcrumbItem[] | false) => {
  const { setBreadcrumb } = useDispatchers(BreadcrumbModule)

  useLayoutEffect(() => {
    if (items) {
      setBreadcrumb(items)
    }
  }, [setBreadcrumb, items])
}
