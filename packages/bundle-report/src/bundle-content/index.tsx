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
import { useMemo, useCallback, FC, useState, useEffect, useContext } from 'react'

import { Select, useWideScreen } from '@perfsee/components'
import { ModuleTreeNode } from '@perfsee/shared'
import { pathFactory } from '@perfsee/shared/routes'

import { RouterContext } from '../router-context'

import { ChartWrapper, Header, Container, ShortcutTips } from './styled'
import { Treemap } from './treemap'

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

  const { history, Link } = useContext(RouterContext)

  return (
    <Container>
      <Header>
        {project && bundleId && Link ? (
          <Link to={pathFactory.project.bundle.detail({ projectId: project.id, bundleId })}>
            <ArrowLeftOutlined />
            <span>Back</span>
          </Link>
        ) : (
          <a onClick={history?.goBack}>
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
        <Treemap content={filteredContent} />
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
