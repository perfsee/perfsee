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

import { useMemo, useCallback, FC } from 'react'

import { Empty } from '@perfsee/components'
import { TreeMapChart } from '@perfsee/components/treemap'
import { ModuleTreeNode } from '@perfsee/shared'
import { hierarchy, SearchEngine, Match } from '@perfsee/treemap'

import { LegendList, UnusedLegendIcon } from './styled'
import { BundleAnalyzerTooltip } from './tooltip'

class BundleContentSearchEngine implements SearchEngine<ModuleTreeNode> {
  private readonly cache = new WeakMap<ModuleTreeNode, Match | null>()
  private readonly query: string

  constructor(query: string) {
    this.query = query.toLowerCase()
  }

  getMatch(node: ModuleTreeNode): Match | null {
    const cachedMatch = this.cache.get(node)
    if (cachedMatch !== undefined) {
      return cachedMatch
    }
    const match =
      node.name.toLowerCase().includes(this.query) ||
      node.modules?.some((item) => item.toLowerCase().includes(this.query))
    const result = match ? { score: 1 } : null
    this.cache.set(node, result)
    return result
  }
}

export interface TreemapProps {
  content: ModuleTreeNode[]
  showDiff?: boolean
}

export const Treemap: FC<TreemapProps> = ({ content, showDiff }) => {
  const treeMapData = useMemo(() => {
    if (content.length > 0) {
      return hierarchy<ModuleTreeNode & { highlight: number }>({
        name: 'root',
        children: content,
        value: 0,
      } as ModuleTreeNode & { highlight: number })
        .sum((d) => (d.children ? 0 : d.value || 0))
        .sort((a, b) => b.data.value - a.data.value)
        .each((node) => {
          showDiff &&
            (node.data.highlight = node.data.baseline
              ? (Math.max(node.data.value - node.data.baseline.size.raw, 0) / node.data.value) * -1
              : -1)
        })
    } else {
      return null
    }
  }, [content, showDiff])

  const handleSearchEngine = useCallback((queryText: string) => new BundleContentSearchEngine(queryText), [])
  return treeMapData ? (
    <>
      {showDiff ? (
        <LegendList>
          <UnusedLegendIcon />
          Diff
        </LegendList>
      ) : null}
      <TreeMapChart onSearchEngine={handleSearchEngine} data={treeMapData} tooltip={BundleAnalyzerTooltip} skipRoot />
    </>
  ) : (
    <Empty withIcon title="No data" styles={{ root: { height: '100%' } }} />
  )
}
