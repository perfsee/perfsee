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
  Breadcrumb as RawBreadcrumb,
  IBreadcrumbProps,
  IBreadcrumbItem,
  IBreadcrumbStyles,
  IRenderFunction,
} from '@fluentui/react'
import { useCallback, useMemo } from 'react'
import { useHistory } from 'react-router-dom'

import { staticPath } from '@perfsee/shared/routes'

import { useProject } from '../../shared'
import { Starring } from '../starring'

const breadcrumbStyles: Partial<IBreadcrumbStyles> = {
  itemLink: { fontSize: 14 },
  item: { fontSize: 14 },
}

export interface BreadCrumbProps extends IBreadcrumbProps {
  kind?: 'project'
}

const projectFirstItem: IBreadcrumbItem = {
  text: 'Projects',
  href: staticPath.projects,
  key: 'home',
}

const firstItemMap: Record<NonNullable<BreadCrumbProps['kind']>, IBreadcrumbItem> = {
  project: projectFirstItem,
}

export const Breadcrumb = ({ items, kind = 'project', ...props }: BreadCrumbProps) => {
  const history = useHistory()
  const project = useProject()

  const breadcrumbItems = useMemo(() => {
    const firstItem = firstItemMap[kind]
    return [firstItem, ...items].map((item) => {
      if (item.href) {
        const link = item.href
        item.onClick = () => {
          history.push(link)
        }
        item.href = undefined
      }

      return item
    })
  }, [items, history, kind])

  const onRenderItem = useCallback<IRenderFunction<IBreadcrumbItem>>(
    (item, defaultRenderer) => {
      if (item && defaultRenderer) {
        const content = defaultRenderer(item)
        if (item.key === 'project') {
          return (
            <>
              {content}
              {project && <Starring projectId={project.id} />}
            </>
          )
        }
        return content
      }
      return null
    },
    [project],
  )

  return <RawBreadcrumb {...props} items={breadcrumbItems} styles={breadcrumbStyles} onRenderItem={onRenderItem} />
}

export { IBreadcrumbItem, IBreadcrumbProps }
