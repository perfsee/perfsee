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

import { useMemo } from 'react'
import { Route as ReactRoute } from 'react-router'
import type { RouteProps as ReactRouteProps } from 'react-router'

import { titleFactory as titleFactories, breadcrumbItems as breadcrumbFactories } from '@perfsee/shared/routes'

import { BreadcrumbItem, useUpdateBreadcrumb } from '../breadcrumb'
import { Helmet } from '../helmet'

interface RouteProps extends ReactRouteProps {
  title?: (data: any) => string
  // Incomplete routes do not display title and breadcrumbs
  incomplete?: boolean
  // transferred by Switch component
  computedMatch?: any
}

export const Route = (props: RouteProps) => {
  const { title, path, computedMatch, incomplete, ...routeProps } = props

  const titleFactory = useMemo(() => {
    if (!title) {
      if (typeof path === 'string') {
        return titleFactories[path] as (data: any) => string | undefined
      }
      return undefined
    } else {
      return title
    }
  }, [path, title])

  const titleString = useMemo(() => {
    if (!titleFactory) {
      return null
    }

    return titleFactory(computedMatch?.params ?? {})
  }, [computedMatch?.params, titleFactory])

  const breadcrumbFactory = useMemo(() => {
    if (typeof path === 'string') {
      return breadcrumbFactories[path] as BreadcrumbItem[]
    }
    return undefined
  }, [path])

  const breadcrumbItems = useMemo(() => {
    if (!breadcrumbFactory) {
      return null
    }

    const data = computedMatch?.params ?? {}

    return breadcrumbFactory.map((breadcrumbItem) => ({
      text: breadcrumbItem.text.replace(/\{(.*?)\}/g, (match, key) => data[key] ?? match),
      href: breadcrumbItem.href.replace(/:([^/]*)/g, (match, key) => data[key.replace('?', '')] ?? match),
    }))
  }, [computedMatch?.params, breadcrumbFactory])

  useUpdateBreadcrumb(!incomplete && breadcrumbItems ? breadcrumbItems : false)

  return (
    <>
      {!incomplete && titleString && <Helmet title={titleString} />}
      <ReactRoute path={path} {...routeProps} />
    </>
  )
}
