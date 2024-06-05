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
import { useModule, useModuleState } from '@sigi/react'
import { parse, stringify } from 'query-string'
import { memo, useEffect, useMemo, useCallback, useRef } from 'react'
import { RouteComponentProps } from 'react-router-dom'

import { BundleReport, RouterContext } from '@perfsee/bundle-report'
import { useToggleState } from '@perfsee/components'
import { BundleJobStatus } from '@perfsee/schema'
import { AssetInfo, ModuleSource, ModuleTreeNode } from '@perfsee/shared'
import { pathFactory } from '@perfsee/shared/routes'

import { ArtifactSelect, ArtifactSelectEventPayload } from '../../components'
import { ProjectModule, useProjectRouteGenerator } from '../../shared'
import { BundleContentModule } from '../bundle-content/module'

import { BundleModule } from './module'
import { SuspiciousBundle } from './suspicious-job'

let resolveContent: ((content: ModuleTreeNode[]) => void) | undefined = undefined
let resolveModuleSource: ((moduleSource: ModuleSource) => void) | undefined = undefined

export const BundleReportContainer = memo<RouteComponentProps<{ name: string; bundleId: string }>>(
  ({ match, location, history }) => {
    const { bundleId: routeBundleId } = match.params
    const bundleId = parseInt(routeBundleId)

    const queries: { entry?: string; baseline?: string } = parse(location.search)
    const hasBaselineInQueries = !!queries.baseline

    const [state, dispatcher] = useModule(BundleModule)
    const [{ content }, bundleContentDispatcher] = useModule(BundleContentModule)
    const contentPromise = useRef(
      new Promise<ModuleTreeNode[]>((resolve) => {
        resolveContent = resolve
      }),
    )

    useEffect(() => {
      if (content && resolveContent) {
        resolveContent(content)
      }
    }, [content])

    const moduleSourcePromise = useRef(
      new Promise<ModuleSource>((resolve) => {
        resolveModuleSource = resolve
      }),
    )

    useEffect(() => {
      if (state.moduleSource && resolveModuleSource) {
        resolveModuleSource(state.moduleSource)
      }
    }, [state.moduleSource])

    useEffect(() => {
      return bundleContentDispatcher.dispose
    }, [bundleContentDispatcher, routeBundleId])

    const getAssetContent = useCallback(
      async (asset: AssetInfo) => {
        let moduleTreeNodes = content

        if (!moduleTreeNodes) {
          bundleContentDispatcher.getContent(bundleId)
          moduleTreeNodes = await contentPromise.current
        }

        return moduleTreeNodes.filter((node) => node.name === asset.name)
      },
      [bundleContentDispatcher, bundleId, content],
    )

    const getModuleReasons = useCallback(async () => {
      let moduleSource = state.moduleSource

      if (!moduleSource && state.current?.moduleReasonsLink) {
        dispatcher.getModuleReasons(state.current.moduleReasonsLink)
        moduleSource = await moduleSourcePromise.current
      }

      return moduleSource
    }, [dispatcher, state])

    const project = useModuleState(ProjectModule, {
      selector: (s) => s.project,
      dependencies: [],
    })
    const generateProjectRoute = useProjectRouteGenerator()
    const contentPath = generateProjectRoute(pathFactory.project.bundle.jobBundleContent, { bundleId })

    const [artifactSelectVisible, showArtifactSelect, hideArtifactSelect] = useToggleState(false)

    const handleSelectArtifact = useCallback(
      (payload: ArtifactSelectEventPayload) => {
        history.push(`${location.pathname}?${stringify({ ...queries, baseline: payload.artifact.id })}`)
        hideArtifactSelect()
      },
      [hideArtifactSelect, history, location.pathname, queries],
    )

    useEffect(() => {
      hasBaselineInQueries ? dispatcher.getBundle(bundleId) : dispatcher.getBundleWithBaseline(bundleId)

      return dispatcher.reset
    }, [dispatcher, bundleId, hasBaselineInQueries])

    useEffect(() => {
      queries.baseline && dispatcher.updateBaseline(Number(queries.baseline))
    }, [queries.baseline, dispatcher])

    const onSelectEntryPoint = useCallback(
      (entryPoint: string) => {
        history.push(`${location.pathname}?${stringify({ ...queries, entry: entryPoint })}`)
      },
      [history, location.pathname, queries],
    )

    const artifactDiff = useMemo(() => {
      const { current, baseline } = state

      if (!project || !current) {
        return null
      }

      return {
        ...current,
        project,
        score: current.score!,
        baseline: baseline
          ? {
              ...baseline,
              jobId: baseline.id,
              score: baseline.score!,
              project,
            }
          : undefined,
      }
    }, [state, project])

    if (state.loading) {
      return <Spinner size={SpinnerSize.large} label="Loading job result" />
    }

    return state.current?.status !== BundleJobStatus.Passed ? (
      <SuspiciousBundle bundle={state.current} />
    ) : (
      state.diff && artifactDiff && (
        <RouterContext.Provider value={{ location, history }}>
          <BundleReport
            artifact={artifactDiff}
            diff={state.diff}
            defaultEntryPoint={queries.entry}
            onEntryPointChange={onSelectEntryPoint}
            onBaselineSelectorOpen={showArtifactSelect}
            contentLink={contentPath}
            downloadLink={state.current.buildLink}
            getAssetContent={getAssetContent}
            getModuleReasons={state.current.moduleReasonsLink ? getModuleReasons : undefined}
          />

          {artifactSelectVisible && (
            <ArtifactSelect
              defaultArtifactName={state.current.name}
              currentArtifactId={state.current.id}
              onSelect={handleSelectArtifact}
              onDismiss={hideArtifactSelect}
            />
          )}
        </RouterContext.Provider>
      )
    )
  },
)
