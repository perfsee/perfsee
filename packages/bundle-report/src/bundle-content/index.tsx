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

import { ArrowLeftOutlined } from '@ant-design/icons'
import { IDropdownOption, IDropdownProps, IRenderFunction } from '@fluentui/react'
import { union } from 'lodash'
import { useMemo, useCallback, FC, useState, useEffect } from 'react'
import { useHistory } from 'react-router'
import { Link } from 'react-router-dom'

import { Empty, Select, useWideScreen } from '@perfsee/components'
import { TreeMapChart } from '@perfsee/components/treemap'
import { ModuleTreeNode } from '@perfsee/shared'
import { pathFactory } from '@perfsee/shared/routes'
import { hierarchy, SearchEngine, Match } from '@perfsee/treemap'

import { ChartWrapper, Header, Container, ShortcutTips } from './styled'
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

export interface BundleContentProps {
  content: ModuleTreeNode[]
  project?: {
    id: string
    host: string
    namespace: string
    name: string
  }
  bundleId?: number
}

export const BundleContent: FC<BundleContentProps> = ({ project, content, bundleId }) => {
  useWideScreen()
  const entryPoints = useMemo(() => {
    return union(...content.map((v) => v.entryPoints))
  }, [content])
  const entryPointsOptions = useMemo(() => {
    return entryPoints.map((v) => ({ key: v, text: v }))
  }, [entryPoints])

  const [filteredEntryPoints, setFilteredEntryPoints] = useState(entryPoints)
  const handleEntryPointsChange = useCallback((selected: string[]) => {
    setFilteredEntryPoints(selected)
  }, [])

  useEffect(() => {
    setFilteredEntryPoints(entryPoints)
  }, [entryPoints])

  const filteredContent = useMemo(() => {
    return filteredEntryPoints.length !== entryPoints.length
      ? content.filter((v) => (v.entryPoints ? v.entryPoints.some((e) => filteredEntryPoints.includes(e)) : true))
      : content
  }, [content, entryPoints, filteredEntryPoints])

  const treeMapData = useMemo(() => {
    if (filteredContent.length > 0) {
      return hierarchy<ModuleTreeNode>({
        name: 'root',
        children: filteredContent,
        value: 0,
      } as ModuleTreeNode)
        .sum((d) => (d.children ? 0 : d.value || 0))
        .sort((a, b) => b.data.value - a.data.value)
    } else {
      return null
    }
  }, [filteredContent])

  const history = useHistory()

  const handleSearchEngine = useCallback((queryText: string) => new BundleContentSearchEngine(queryText), [])

  return (
    <Container>
      <Header>
        {project && bundleId ? (
          <Link to={pathFactory.project.bundle.detail({ projectId: project.id, bundleId })}>
            <ArrowLeftOutlined />
            <span>Back</span>
          </Link>
        ) : (
          <a onClick={history.goBack}>
            <ArrowLeftOutlined />
            <span>Back</span>
          </a>
        )}
        {entryPoints.length > 1 && (
          <MultiSelect
            title="Entry Point"
            placeholder="Filter entry point"
            onSelectedKeysChange={handleEntryPointsChange}
            selectedKeys={filteredEntryPoints}
            options={entryPointsOptions}
          />
        )}
        <ShortcutTips>
          <p>
            i:&nbsp;
            <kbd>Ctrl/Command</kbd> + <kbd>Wheel</kbd> to scale
          </p>
          <p>
            &nbsp;&nbsp;&nbsp;
            <kbd>Ctrl/Command</kbd> + <kbd>F</kbd> to search
          </p>
        </ShortcutTips>
      </Header>
      <ChartWrapper>
        {treeMapData ? (
          <TreeMapChart
            onSearchEngine={handleSearchEngine}
            data={treeMapData}
            tooltip={BundleAnalyzerTooltip}
            skipRoot
          />
        ) : (
          <Empty withIcon title="No data" styles={{ root: { height: '100%' } }} />
        )}
      </ChartWrapper>
    </Container>
  )
}

interface MultiSelectProps extends IDropdownProps {
  onSelectedKeysChange: (selected: string[]) => void
  selectedKey?: never
  selectedKeys: string[]
}

const MultiSelect: FC<MultiSelectProps> = ({
  options,
  selectedKeys,
  onChange,
  onSelectedKeysChange,
  ...otherProps
}) => {
  const finalOptions = useMemo(() => [{ key: '__ALL__', text: 'All' }, ...options], [options])
  const finalSelectedKeys = useMemo(() => {
    if (selectedKeys?.length === options.length) {
      return ['__ALL__', ...selectedKeys]
    } else {
      return selectedKeys
    }
  }, [options.length, selectedKeys])

  const handleEntryPointsChange = useCallback(
    (event: React.FormEvent<HTMLDivElement>, item?: IDropdownOption, index?: number) => {
      onChange?.(event, item, index)
      if (item) {
        if (item.key === '__ALL__') {
          onSelectedKeysChange(item.selected ? options.map((o) => o.key.toString()) : [])
        } else {
          onSelectedKeysChange(
            item.selected ? [...selectedKeys, item.key as string] : selectedKeys.filter((key) => key !== item.key),
          )
        }
      }
    },
    [onChange, onSelectedKeysChange, options, selectedKeys],
  )

  const handleRenderTitle = useCallback<IRenderFunction<IDropdownOption<any>[]>>(
    (options, defaultRender) => {
      if (options?.length === finalOptions.length) {
        return <>All</>
      }
      return <>{defaultRender?.(options)}</>
    },
    [finalOptions.length],
  )

  return (
    <Select
      multiSelect
      onChange={handleEntryPointsChange}
      selectedKeys={finalSelectedKeys}
      options={finalOptions}
      styles={{ root: { width: 300 } }}
      onRenderTitle={handleRenderTitle}
      {...otherProps}
    />
  )
}
