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

import { PartitionOutlined } from '@ant-design/icons'
import { Shimmer, Stack } from '@fluentui/react'
import { groupBy, range } from 'lodash'
import { FC, useEffect, useMemo, useState } from 'react'
import { getHighlighterCore } from 'shiki/core'
import jsLang from 'shiki/langs/javascript.mjs'
import githubLight from 'shiki/themes/github-light.mjs'
import getWasm from 'shiki/wasm'

import { Empty, FileColorsMaps } from '@perfsee/components'
import { ModuleReasons, hashCode, ModuleReasonTypes } from '@perfsee/shared'

import { detectFileType } from '../../bundle-content/treeview'
import { CodeContainer, ModulePath, MoreResults, TraceIconWrap } from '../style'

export enum TraceType {
  Reasons,
  SideEffects,
}
export interface Props {
  modulePath: string
  type: TraceType
  getModuleReasons?: (sourceRef: number, targetRef: number) => Promise<ModuleReasons | null>
  searchText?: string
  onClickPath?: (path: string) => void
}

export const LoadingShimmer = () => {
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

export type Reason = [type: number, loc: string, moduleId: string | number]

export interface CodeProps {
  reasons?: Reason[]
  searchText?: string
  onClickPath?: (path: string) => void
  moduleReasons: ModuleReasons | null
}

export const Code: FC<CodeProps> = ({ reasons, searchText, moduleReasons, onClickPath }) => {
  const [highlighter, setHilighter] =
    useState<ReturnType<typeof getHighlighterCore> extends Promise<infer H> ? H : never>()

  useEffect(() => {
    const render = async () => {
      const webHighlighter = await getHighlighterCore({
        themes: [githubLight],
        langs: [jsLang],
        loadWasm: getWasm,
      })

      setHilighter(webHighlighter)
    }

    render().catch(() => {})
  }, [])

  const elements = useMemo(() => {
    if (!highlighter || !reasons?.length || !moduleReasons?.moduleSource) {
      return []
    }
    const grouped = groupBy(reasons, (r) => r[2])

    return Object.entries(grouped).map(([moduleId, reasons]) => {
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

      const Icon = FileColorsMaps[detectFileType(path)]

      try {
        html =
          highlighter.codeToHtml(filteredCode, {
            lang: 'js',
            theme: 'github-light',
            decorations,
          }) || ''
      } catch {
        html =
          highlighter.codeToHtml(filteredCode, {
            lang: 'js',
            theme: 'github-light',
          }) || ''
      }
      return (
        <Stack key={module[0]}>
          <ModulePath>
            <Icon.icon />
            {path}:{locations.map(([line, colStart, colEnd]) => `${line + 1}:${colStart}-${colEnd}`).join(', ')}
            {onClickPath ? (
              // eslint-disable-next-line
              <TraceIconWrap className="button" onClick={() => onClickPath(path)}>
                <PartitionOutlined />
              </TraceIconWrap>
            ) : null}
          </ModulePath>
          <CodeContainer
            dangerouslySetInnerHTML={{
              __html: html,
            }}
          />
        </Stack>
      )
    })
  }, [highlighter, reasons, searchText, moduleReasons, onClickPath])

  if (!highlighter) {
    return <LoadingShimmer />
  }

  if (!reasons?.length) {
    return <Empty withIcon title="No import reasons data" />
  }

  if (!moduleReasons?.moduleSource) {
    return <Empty title="No module source data" withIcon />
  }

  if (!elements.filter(Boolean).length) {
    return <Empty title="No data" withIcon />
  }

  return (
    <>
      {elements.length >= 100
        ? elements
            .slice(0, 100)
            .concat(
              <MoreResults>{elements.length} modules in total. Please use search to view more results.</MoreResults>,
            )
        : elements}
    </>
  )
}

export const ModuleCode: FC<Props> = ({ modulePath, getModuleReasons, searchText, type, onClickPath }) => {
  const moduleId = hashCode(modulePath)
  const [loading, setLoading] = useState(true)
  const [moduleReasons, setModuleReasons] = useState<ModuleReasons | null>(null)

  useEffect(() => {
    if (getModuleReasons) {
      setLoading(true)
      getModuleReasons(moduleId, 0)
        .then((moduleReasons) => {
          if (moduleReasons) {
            setModuleReasons(moduleReasons)
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [moduleId, getModuleReasons])

  const code = useMemo(() => {
    const reasons = (type === TraceType.SideEffects ? moduleReasons?.sideEffects : moduleReasons?.moduleReasons)?.[
      moduleId
    ]

    return <Code reasons={reasons} moduleReasons={moduleReasons} searchText={searchText} onClickPath={onClickPath} />
  }, [moduleReasons, moduleId, searchText, onClickPath, type])

  if (loading) {
    return <LoadingShimmer />
  }

  return <>{code}</>
}
