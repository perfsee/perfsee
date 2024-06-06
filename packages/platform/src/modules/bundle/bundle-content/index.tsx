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

import { Spinner, SpinnerSize } from '@fluentui/react'
import { useModule } from '@sigi/react'
import { useEffect } from 'react'
import { useParams, useHistory, useLocation } from 'react-router'
import { Link } from 'react-router-dom'

import { BundleContent, RouterContext } from '@perfsee/bundle-report'

import { useProject } from '../../shared'

import { BundleContentModule } from './module'

export const BundleContentContainer = () => {
  const [{ content, loading }, dispatcher] = useModule(BundleContentModule)
  const project = useProject()
  const { bundleId: routeBundleId } = useParams<{
    bundleId: string
  }>()
  const history = useHistory()
  const location = useLocation()

  useEffect(() => {
    const bundleId = parseInt(routeBundleId)

    dispatcher.getContent(bundleId)

    return () => {
      dispatcher.dispose()
    }
  }, [dispatcher, routeBundleId])

  if (loading) {
    return <Spinner size={SpinnerSize.large} />
  }

  if (!content) {
    return null
  }

  return (
    <RouterContext.Provider value={{ location, history, Link }}>
      <BundleContent content={content} project={project!} bundleId={parseInt(routeBundleId)} />
    </RouterContext.Provider>
  )
}
