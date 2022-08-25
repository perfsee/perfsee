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

import styled from '@emotion/styled'
import { useModule } from '@sigi/react'
import { useRef, useEffect, useState, useCallback } from 'react'

import { HierarchyNode, NameSearchEngine, SearchEngine, TreeMap, TreeMapData } from '@perfsee/treemap'

import { TreeMapControllerModule } from './controller'
import { SearchBox, useSearchBoxShortcut } from './search-box'
import { TreeMapTooltipContainer } from './tooltip'

export interface TreeMapTooltipProps<TData> {
  data: TData
}

interface Props<TData extends TreeMapData> {
  data: HierarchyNode<TData>
  tooltip?: React.ComponentType<TreeMapTooltipProps<TData>>
  onSearchEngine?: (queryText: string) => SearchEngine<TData>
  skipRoot?: boolean
}

export const TreeMapChart = <TData extends TreeMapData>({
  data,
  tooltip: Tooltip,
  skipRoot,
  onSearchEngine,
}: Props<TData>) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [treeMap, setTreeMap] = useState<TreeMap<TData> | null>(null)
  const [{ tooltip }, dispatcher] = useModule(TreeMapControllerModule)
  const [searchQuery, setSearchQuery] = useState<string | null>()
  const [searchBoxVisibility, setSearchBoxVisibility] = useState<boolean>()

  useEffect(() => {
    const treeMap = new TreeMap(canvasRef.current!, data, { skipRoot })
    setTreeMap(treeMap)

    return () => {
      setTreeMap(null)
      treeMap.dispose()
    }
  }, [data, skipRoot])

  const handleHoverTreeMap = useCallback<NonNullable<TreeMap<TData>['onHover']>>(
    (data, nodeOffsetRect) => {
      if (!data || !nodeOffsetRect) {
        // hover in tree map but not in a node
        dispatcher.updateTooltip(null)
      } else {
        const canvasRect = canvasRef.current!.getBoundingClientRect()
        const newTooltip = {
          targetClientRect: {
            left: nodeOffsetRect.left + canvasRect.left,
            top: nodeOffsetRect.top + canvasRect.top,
            width: nodeOffsetRect.width,
            height: nodeOffsetRect.height,
          },
          data,
        }
        dispatcher.updateTooltip(newTooltip)
      }
    },
    [dispatcher],
  )

  const handleHoverTreeMapEnd = useCallback(() => {
    dispatcher.updateTooltip(null)
  }, [dispatcher])

  useEffect(() => {
    if (treeMap) {
      treeMap.onHover = handleHoverTreeMap
      treeMap.onHoverEnd = handleHoverTreeMapEnd

      return () => {
        treeMap.onHover = undefined
        treeMap.onHoverEnd = undefined
      }
    }
  }, [handleHoverTreeMap, handleHoverTreeMapEnd, treeMap])

  const handleMouseEnterTooltip = useCallback(() => {
    dispatcher.hoverTooltip(true)
  }, [dispatcher])

  const handleMouseLeaveTooltip = useCallback(() => {
    dispatcher.hoverTooltip(false)
  }, [dispatcher])

  const handleSearch = useCallback((searchQuery: string | null) => {
    setSearchQuery(searchQuery)
  }, [])

  const handleCloseSearchBox = useCallback(() => {
    setSearchQuery(null)
    setSearchBoxVisibility(false)
  }, [])

  const handleOpenSearchBox = useCallback(() => {
    setSearchBoxVisibility(true)
  }, [])

  useSearchBoxShortcut(handleOpenSearchBox, handleCloseSearchBox)

  useEffect(() => {
    if (treeMap) {
      if (searchQuery && searchQuery.length > 0) {
        treeMap.setSearch(
          typeof onSearchEngine === 'function' ? onSearchEngine(searchQuery) : new NameSearchEngine(searchQuery),
        )
      } else {
        treeMap.clearSearch()
      }
    }
  }, [onSearchEngine, searchQuery, treeMap])

  useEffect(() => dispatcher.reset, [dispatcher])

  return (
    <Container>
      <Canvas ref={canvasRef} style={{ height: '100%', width: '100%' }} />
      {tooltip && Tooltip && (
        <TreeMapTooltipContainer
          targetClientRect={tooltip.targetClientRect}
          onMouseEnter={handleMouseEnterTooltip}
          onMouseLeave={handleMouseLeaveTooltip}
        >
          <Tooltip data={tooltip.data as TData} />
        </TreeMapTooltipContainer>
      )}
      {searchBoxVisibility && <PositionedSearchBox onSearch={handleSearch} onClose={handleCloseSearchBox} />}
    </Container>
  )
}

const Container = styled.div({
  position: 'relative',
  width: '100%',
  height: '100%',
})

const Canvas = styled.canvas({
  width: '100%',
  height: '100%',
})

const PositionedSearchBox = styled(SearchBox)({
  position: 'absolute',
  right: '0px',
  top: '0px',
  zIndex: 1,
})
