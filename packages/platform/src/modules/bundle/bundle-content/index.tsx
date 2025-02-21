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
import { useEffect, useMemo } from 'react'
import { useParams, useHistory, useLocation } from 'react-router'
import { Link } from 'react-router-dom'

import { BundleContent, RouterContext } from '@perfsee/bundle-report'
import { useQueryString } from '@perfsee/components'
import { diffBundleContent } from '@perfsee/shared'

import { useProject } from '../../shared'
import { BundleModule } from '../detail/module'

import { BundleContentModule } from './module'

export const BundleContentContainer = () => {
  const [{ content, loading, baselineContent }, dispatcher] = useModule(BundleContentModule)
  const project = useProject()
  const { bundleId: routeBundleId } = useParams<{
    bundleId: string
  }>()
  const [{ baseline }] = useQueryString<{ baseline?: string }>()
  const history = useHistory()
  const location = useLocation()
  const [state, bundleDispatcher] = useModule(BundleModule)
  const bundleId = parseInt(routeBundleId)

  useEffect(() => {
    dispatcher.getContent({ current: bundleId, baseline: Number(baseline) })

    return () => {
      dispatcher.dispose()
    }
  }, [dispatcher, baseline, bundleId])

  useEffect(() => {
    if (!state.diff) {
      baseline ? bundleDispatcher.getBundle(bundleId) : bundleDispatcher.getBundleWithBaseline(bundleId)
    }
  }, [state, baseline, bundleDispatcher, bundleId])

  useEffect(() => {
    state.baseline && !baselineContent && dispatcher.fetchBaselineContentFromStorage(state.baseline?.contentLink)
  }, [state.baseline, dispatcher, baselineContent])

  useEffect(() => {
    baseline && bundleDispatcher.updateBaseline(Number(baseline))
  }, [baseline, bundleDispatcher])

  useEffect(() => {
    return bundleDispatcher.reset
  }, [bundleDispatcher, baseline, bundleId])

  const moduleTreeNodes = useMemo(() => {
    return state.diff && content && baselineContent
      ? diffBundleContent(state.current, state.baseline, state.diff, content, baselineContent)
      : content || []
  }, [content, baselineContent, state])

  if (loading) {
    return <Spinner size={SpinnerSize.large} />
  }

  if (!content) {
    return null
  }

  return (
    <RouterContext.Provider value={{ location, history, Link }}>
      <BundleContent
        content={moduleTreeNodes}
        project={project!}
        bundleId={parseInt(routeBundleId)}
        showDiff={!!state.baseline}
      />
    </RouterContext.Provider>
  )
}
