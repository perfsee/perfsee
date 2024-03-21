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

import { Modal, Shimmer, Stack } from '@fluentui/react'
import { groupBy, range } from 'lodash'
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getHighlighterCore } from 'shiki/core'
import jsLang from 'shiki/langs/javascript.mjs'
import githubLight from 'shiki/themes/github-light.mjs'
import getWasm from 'shiki/wasm'

import { Empty, FileIcon } from '@perfsee/components'
import { Chart, ChartHeader, EChartsOption } from '@perfsee/components/chart'
import { ChartEventParam } from '@perfsee/components/chart/types'
import { SOURCE_CODE_PATH, PackageIssueMap, AssetTypeEnum, ModuleReasons, ModuleReasonTypes } from '@perfsee/shared'

import { CodeContainer, ModulePath, MoreResults } from '../style'

import { AssetFilter } from './asset-filter'
import TraceHintImage from './trace-hint.png'

type Props = {
  traceSourceRef: number | null
  packageIssueMap: PackageIssueMap | undefined
  onClose: () => void
  onChangeSource: (ref: number) => void
  getModuleReasons?: (sourceRef: number, targetRef: number) => Promise<ModuleReasons | null>
}

type GraphNodeData = { name: string; ref?: number; symbolSize?: number; version?: string; id: string }

const LoadingShimmer = () => {
  return (
    <Stack tokens={{ childrenGap: '40px', padding: '10px' }}>
      {range(5).map((i) => (
        <Stack key={`row-${i}`} tokens={{ childrenGap: '12px' }}>
          {range(6).map((j) => (
            <Shimmer key={`col-${j}`} />
          ))}
        </Stack>
      ))}
    </Stack>
  )
}

export const ImportTraceModal: FC<Props> = ({
  traceSourceRef,
  packageIssueMap,
  onClose,
  onChangeSource,
  getModuleReasons,
}) => {
  const highlighter = useRef<ReturnType<typeof getHighlighterCore> extends Promise<infer H> ? H : never>()
  const [currentSelected, setCurrentSelected] = useState<
    [sourceRef: number, targetRef: number, sourceName: string, targetName: string] | null
  >(null)
  const [moduleReasons, setModuleReasons] = useState<ModuleReasons | undefined>()
  const [searchText, setSearchText] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (currentSelected && getModuleReasons) {
      const [sourceRef, targetRef] = currentSelected
      setLoading(true)
      getModuleReasons(sourceRef, targetRef)
        .then((moduleSource) => {
          if (moduleSource) {
            setModuleReasons(moduleSource)
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [currentSelected, getModuleReasons])

  useEffect(() => {
    setCurrentSelected(null)
  }, [traceSourceRef])

  const [points, edges] = useMemo(() => {
    if (!traceSourceRef || !packageIssueMap) {
      return []
    }

    const pkgRefs: Array<[null | number, number]> = [[null, traceSourceRef]]
    const pointsMap = new Map<number, GraphNodeData>()
    const edges: Array<{ source: string; target: string }> = []

    while (pkgRefs.length) {
      const current = pkgRefs.pop()
      if (!current) {
        continue
      }

      const [sourceRef, ref] = current

      const sourcePkg = sourceRef ? packageIssueMap[sourceRef] : null
      const pkg = packageIssueMap[ref]
      if (!pkg) {
        continue
      }

      if (!pointsMap.has(pkg.ref)) {
        const value = { name: pkg.name, version: pkg.version, id: String(pkg.ref) }

        if (!sourcePkg || pkg.name === SOURCE_CODE_PATH) {
          value['symbolSize'] = 100
          value['itemStyle'] = {
            color: '#91cc75',
          }
        } else {
          value['symbolSize'] = 80
          value['ref'] = pkg.ref
        }

        pointsMap.set(pkg.ref, value)
      }

      if (sourcePkg) {
        edges.push({
          source: String(ref),
          target: String(sourceRef),
          targetName: sourcePkg.name,
          sourceName: pkg.name,
          sourceVersion: pkg.version,
          targetVersion: sourcePkg.version,
        })
      }

      if (pkg.issuerRefs?.length && pkg.name !== SOURCE_CODE_PATH) {
        pkgRefs.push(...pkg.issuerRefs.map((nextRef) => [ref, nextRef] as [number, number]))
      }
    }

    const traceSourceName = packageIssueMap[traceSourceRef].name

    Object.values(packageIssueMap)
      .filter(({ issuerRefs }) => issuerRefs.some((ref) => ref === traceSourceRef))
      .forEach(({ name, ref, version }) => {
        pointsMap.set(ref, { name, ref, itemStyle: { color: '#73c0de' }, version, id: String(ref) })
        edges.push({
          source: String(traceSourceRef),
          target: String(ref),
          targetName: name,
          sourceName: traceSourceName,
          targetVersion: version,
          sourceVersion: packageIssueMap[traceSourceRef].version,
        })
      })

    const pointsNameMap = new Map<string, number>()
    pointsMap.forEach((v) => {
      const count = pointsNameMap.get(v.name) || 0
      pointsNameMap.set(v.name, count + 1)
    })
    pointsMap.forEach((v) => {
      const count = pointsNameMap.get(v.name)!
      if (count >= 2 && v.version) {
        v.name = `${v.name}@${v.version}`
      }
    })

    return [[...pointsMap.values()], edges]
  }, [packageIssueMap, traceSourceRef])

  const option = useMemo<EChartsOption>(
    () => ({
      series: [
        {
          type: 'graph',
          layout: 'circular',
          roam: true,
          animation: false,
          symbolSize: 50,
          edgeSymbol: ['none', 'arrow'],
          label: {
            show: true,
          },
          data: points,
          links: edges,
          emphasis: {
            focus: 'adjacency',
            lineStyle: {
              width: 4,
            },
          },
        },
      ],
    }),
    [edges, points],
  )

  const sourceTitle = useMemo(() => {
    if (!traceSourceRef || !packageIssueMap) {
      return ''
    }

    const pkg = packageIssueMap[traceSourceRef]
    return pkg.version ? `${pkg.name}@${pkg.version}` : pkg.name
  }, [traceSourceRef, packageIssueMap])

  useEffect(() => {
    const render = async () => {
      const webHighlighter = await getHighlighterCore({
        themes: [githubLight],
        langs: [jsLang],
        loadWasm: getWasm,
      })

      highlighter.current = webHighlighter
    }

    render().catch(() => {})
  }, [])

  const onClickChart = useCallback(
    (params: ChartEventParam) => {
      if (params.dataType === 'edge') {
        setCurrentSelected([
          Number(params.data.source),
          Number(params.data.target),
          params.data.sourceVersion ? `${params.data.sourceName}@${params.data.sourceVersion}` : params.data.sourceName,
          params.data.targetVersion ? `${params.data.targetName}@${params.data.targetVersion}` : params.data.targetName,
        ])
        return
      }
      if (!params || params.dataType !== 'node') {
        return
      }

      const data = params.data as GraphNodeData

      if (data.ref) {
        onChangeSource(data.ref)
      }
    },
    [onChangeSource],
  )

  const code = useMemo(() => {
    if (!currentSelected) {
      return (
        <Stack verticalAlign="center" horizontalAlign="center">
          <img src={TraceHintImage} style={{ maxWidth: 480, marginTop: 96, width: '80%' }} />
        </Stack>
      )
    }
    if (loading) {
      return <LoadingShimmer />
    }
    const packageIssue = packageIssueMap?.[currentSelected[1]]
    if (!packageIssue) {
      return <Empty title="No package issuers data" withIcon />
    }

    if (!moduleReasons?.packageReasons) {
      return <Empty title="No module source data" withIcon />
    }

    const issuerIndex = packageIssue.issuerRefs.indexOf(currentSelected[0])
    const reasons = moduleReasons.packageReasons[currentSelected[1]]?.[issuerIndex]

    if (!reasons?.length) {
      return <Empty title="No import reasons data" withIcon />
    }

    if (!moduleReasons?.moduleSource) {
      return <Empty title="No module source data" withIcon />
    }

    const grouped = groupBy(reasons, (r) => r[2])

    const elements = Object.entries(grouped).map(([moduleId, reasons]) => {
      const module = moduleReasons.moduleSource![moduleId]
      if (!module) {
        return null
      }
      const [path, code] = module
      if (searchText && !path.toLowerCase().includes(searchText.toLowerCase())) {
        return null
      }
      const locations = reasons.map((r) => {
        const [line, colRange] = r[1].split(':')
        const [colStart, colEnd] = colRange.split('-')
        return [Number(line) - 1, Number(colStart), Number(colEnd), ModuleReasonTypes[r[0]]] as const
      })

      const filteredCode = code
        .split('\n')
        .map((lineSource, lineNum) => {
          if (locations.some((l) => Math.abs(l[0] - lineNum) <= 1)) {
            return lineSource || ' '
          }
          return ''
        })
        .join('\n')

      const decorations = locations.map(([line, colStart, colEnd, reasonType]) => {
        return {
          start: { line, character: colStart },
          end: { line, character: colEnd },
          properties: { class: 'highlighted-word', 'data-type': reasonType },
        }
      })
      let html = ''

      try {
        html =
          highlighter.current?.codeToHtml(filteredCode, {
            lang: 'js',
            theme: 'github-light',
            decorations,
          }) || ''
      } catch {
        return (
          <Stack key={module[0]}>
            <ModulePath>
              <FileIcon type={AssetTypeEnum.Js} />
              {path}
            </ModulePath>
            <Empty title="Source code invalid" withIcon />
          </Stack>
        )
      }
      return (
        <Stack key={module[0]}>
          <ModulePath>
            <FileIcon type={AssetTypeEnum.Js} />
            {path}
          </ModulePath>
          <CodeContainer
            dangerouslySetInnerHTML={{
              __html: html,
            }}
          />
        </Stack>
      )
    })

    if (!elements.filter(Boolean).length) {
      return <Empty title="No data" withIcon />
    }

    return elements.length >= 100
      ? elements
          .slice(0, 100)
          .concat(
            <MoreResults>{elements.length} modules in total. Please use search to view more results.</MoreResults>,
          )
      : elements
  }, [currentSelected, packageIssueMap, moduleReasons, searchText, loading])

  const importLocations = getModuleReasons ? (
    <Stack
      verticalAlign="stretch"
      styles={{
        root: { flexBasis: '40%', overflowX: 'hidden', overflowY: 'auto', height: '85vh', paddingBottom: 24 },
      }}
    >
      <Stack styles={{ root: { padding: '18px 28px' } }}>
        <ChartHeader
          title={
            currentSelected ? (
              <Stack horizontal verticalAlign="center">
                {`Import locations of ${currentSelected[2]} -> ${currentSelected[3]}`}
                <AssetFilter searchText={searchText} onChangeSearchText={setSearchText} title="Search Modules" />
              </Stack>
            ) : (
              'Click a path to see import locations.'
            )
          }
          tips={
            currentSelected ? `This display where [${currentSelected[3]}] is imported by [${currentSelected[2]}]` : ''
          }
        />
      </Stack>
      {code}
    </Stack>
  ) : null

  return (
    <Modal
      isOpen={!!traceSourceRef}
      onDismiss={onClose}
      styles={{ main: { width: '90vw', height: '85vh', overflowY: 'hidden' } }}
    >
      <Stack horizontal>
        <Stack grow={1} styles={{ root: { minWidth: 'calc(50vw + 160px)' } }}>
          <Chart
            option={option}
            mergeCustomOption={false}
            style={{ height: '80vh', display: 'flex', justifyContent: 'center' }}
            onEvents={{ click: onClickChart }}
          >
            <ChartHeader
              title={`Import trace of ${sourceTitle}`}
              tips={`This display why [${sourceTitle}] will be imported and the packages imported by [${sourceTitle}]`}
            />
          </Chart>
        </Stack>
        {importLocations}
      </Stack>
    </Modal>
  )
}
