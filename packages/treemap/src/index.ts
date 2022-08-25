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

import { HierarchyNode } from 'd3-hierarchy'

import BoxRender from './box/render'
import { AffineTransform, Rect, Vec2 } from './math'
import { SearchEngine } from './search'
import SDFTextRender from './text/render'
import { TreeMapController, TreeMapData } from './treemap'
import ViewportController from './viewport'

interface TreeMapOptions {
  skipRoot?: boolean
}

export class TreeMap<TData extends TreeMapData> {
  onHover?: (
    nodeData: TData | null,
    nodeRect: { left: number; top: number; width: number; height: number } | null,
    mouseOffset: { left: number; top: number },
  ) => void
  onHoverEnd?: () => void
  private readonly gl: WebGLRenderingContext
  private readonly viewportController: ViewportController
  private readonly treeMapController: TreeMapController<TData>
  private readonly boxRender: BoxRender
  private readonly textRender: SDFTextRender
  private animationFrame = -1
  private disposed = false
  private hoverIndex = -1
  private readonly options: Required<TreeMapOptions>
  private searchEngine?: SearchEngine<TData>

  constructor(canvas: HTMLCanvasElement, data: HierarchyNode<TData>, options?: TreeMapOptions) {
    this.options = {
      skipRoot: false,
      ...options,
    }
    this.gl = canvas.getContext('webgl')!
    this.gl.getExtension('OES_standard_derivatives')
    this.gl.blendFuncSeparate(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA, this.gl.ONE, this.gl.ONE)
    this.gl.enable(this.gl.BLEND)
    this.viewportController = new ViewportController(canvas, AffineTransform.withScale(new Vec2(1, 1)))
    this.treeMapController = new TreeMapController(
      data,
      this.viewportController.logicalSpaceRect.size,
      this.options.skipRoot,
    )
    this.boxRender = new BoxRender(this.gl)
    this.textRender = new SDFTextRender(this.gl)
    this.applyViewportEvents()
    this.buildRenderData()
    this.render()
    this.loadTexture().catch((err) => {
      console.error('load tree map texture error: ' + err)
    })
  }

  async loadTexture() {
    await this.textRender.loadTexture()
    this.render()
  }

  setSearch(searchEngine: SearchEngine<TData>) {
    this.searchEngine = searchEngine
    this.updateSearchRenderData()
    this.render()
  }

  clearSearch() {
    this.searchEngine = undefined
    this.updateSearchRenderData()
    this.render()
  }

  dispose() {
    cancelAnimationFrame(this.animationFrame)
    this.removeViewportEvents()
    this.viewportController.dispose()
    this.disposed = true
  }

  private buildRenderData() {
    this.treeMapController.setSize(this.viewportController.logicalSpaceRect.size)

    this.boxRender.setRect(this.treeMapController.rects.map((item) => item.rect))
    this.boxRender.setColor(this.treeMapController.rects.map((item) => item.color))
    this.boxRender.setIndex(this.treeMapController.rects.map((item) => item.index))
    this.boxRender.setHighlight(this.treeMapController.rects.map((item) => item.highlight))
    this.boxRender.setActive(this.getSearchResult())

    this.textRender.setTextBoxDraws(
      this.treeMapController.rects.map((item) => {
        const height = item.rect.height()
        const width = item.rect.width()
        const textBoxHeight = item.hasChild ? height * 0.07 : height
        const horizontalPadding = width * 0.1
        const verticalPadding = textBoxHeight * 0.1
        return {
          text: item.name,
          rect: new Rect(
            new Vec2(item.rect.origin.x + horizontalPadding, item.rect.origin.y + verticalPadding),
            new Vec2(item.rect.width() - horizontalPadding * 2, textBoxHeight - verticalPadding * 2),
          ),
        }
      }),
    )
  }

  private updateSearchRenderData() {
    this.boxRender.setActive(this.getSearchResult())
  }

  private getSearchResult() {
    return this.searchEngine
      ? this.treeMapController.rects.map((item) => !!this.searchEngine!.getMatch(item.data))
      : this.treeMapController.rects.map((_) => false)
  }

  private handleResize() {
    this.buildRenderData()
  }

  private handleViewportChange(newViewport: Rect) {
    if (
      newViewport.width() > this.viewportController.logicalSpaceRect.width() ||
      newViewport.height() > this.viewportController.logicalSpaceRect.height()
    ) {
      let width, height
      if (
        newViewport.height() / this.viewportController.logicalSpaceRect.height() >
        newViewport.width() / this.viewportController.logicalSpaceRect.width()
      ) {
        width = this.viewportController.logicalSpaceRect.width()
        height = (width / newViewport.width()) * newViewport.height()
      } else {
        height = this.viewportController.logicalSpaceRect.height()
        width = (height / newViewport.height()) * newViewport.width()
      }

      newViewport = newViewport.withSize(new Vec2(width, height))
    }

    if (newViewport.width() < 1 || newViewport.height() < 1) {
      let width, height
      if (newViewport.height() / 1 > newViewport.width() / 1) {
        width = 1
        height = (width / newViewport.width()) * newViewport.height()
      } else {
        height = 1
        width = (height / newViewport.height()) * newViewport.width()
      }

      newViewport = newViewport.withSize(new Vec2(width, height))
    }

    if (newViewport.left() < this.viewportController.logicalSpaceRect.left()) {
      newViewport = newViewport.withOrigin(
        newViewport.origin.withX(
          newViewport.origin.x + this.viewportController.logicalSpaceRect.left() - newViewport.left(),
        ),
      )
    }

    if (newViewport.top() < this.viewportController.logicalSpaceRect.top()) {
      newViewport = newViewport.withOrigin(
        newViewport.origin.withY(
          newViewport.origin.y + this.viewportController.logicalSpaceRect.top() - newViewport.top(),
        ),
      )
    }

    if (newViewport.right() > this.viewportController.logicalSpaceRect.right()) {
      newViewport = newViewport.withOrigin(
        newViewport.origin.withX(
          newViewport.origin.x - (newViewport.right() - this.viewportController.logicalSpaceRect.right()),
        ),
      )
    }

    if (newViewport.bottom() > this.viewportController.logicalSpaceRect.bottom()) {
      newViewport = newViewport.withOrigin(
        newViewport.origin.withY(
          newViewport.origin.y - (newViewport.bottom() - this.viewportController.logicalSpaceRect.bottom()),
        ),
      )
    }

    this.render()

    return newViewport
  }

  private handleHover(position: Vec2, logicalSpacePosition: Vec2) {
    const hoverNode = this.treeMapController.findNodeByPosition(position)
    const mouseOffset = { left: logicalSpacePosition.x, top: logicalSpacePosition.y }
    if (!hoverNode) {
      this.hoverIndex = -1
      if (typeof this.onHover === 'function') {
        this.onHover(null, null, mouseOffset)
      }
    } else {
      this.hoverIndex = hoverNode.index
      if (typeof this.onHover === 'function') {
        const nodeRect = AffineTransform.betweenRects(
          this.viewportController.viewport,
          this.viewportController.logicalSpaceRect,
        ).transformRect(hoverNode.rect)
        this.onHover(
          hoverNode.data ?? null,
          { left: nodeRect.left(), top: nodeRect.top(), width: nodeRect.width(), height: nodeRect.height() },
          mouseOffset,
        )
      }
    }

    this.render()
  }

  private handleHoverEnd() {
    if (this.hoverIndex !== -1) {
      this.hoverIndex = -1
      this.render()

      if (typeof this.onHoverEnd === 'function') {
        this.onHoverEnd()
      }
    }
  }

  private handleClick(p: Vec2) {
    const hoverNode = this.treeMapController.findNodeByPosition(p)
    if (hoverNode) {
      const hoverNodeRect = hoverNode.rect
      const currentViewport = this.viewportController.viewport
      const targetCenter = hoverNode.rect.bottomRight().minus(hoverNode.rect.size.times(0.5))

      let width, height
      if (currentViewport.height() / hoverNodeRect.height() > currentViewport.width() / hoverNodeRect.width()) {
        width = hoverNodeRect.width()
        height = (width / currentViewport.width()) * currentViewport.height()
      } else {
        height = hoverNodeRect.height()
        width = (height / currentViewport.height()) * currentViewport.width()
      }

      width *= 1.3
      height *= 1.3

      const left = targetCenter.x - width / 2
      const top = targetCenter.y - height / 2
      const newViewport = new Rect(new Vec2(left, top), new Vec2(width, height))
      this.viewportController.transitionViewport(newViewport)
    }
  }

  private applyViewportEvents() {
    this.viewportController.onResize = this.handleResize.bind(this)
    this.viewportController.onViewportChange = this.handleViewportChange.bind(this)
    this.viewportController.onHover = this.handleHover.bind(this)
    this.viewportController.onHoverEnd = this.handleHoverEnd.bind(this)
    this.viewportController.onClick = this.handleClick.bind(this)
  }

  private removeViewportEvents() {
    this.viewportController.onResize = undefined
    this.viewportController.onViewportChange = undefined
    this.viewportController.onHover = undefined
    this.viewportController.onHoverEnd = undefined
    this.viewportController.onClick = undefined
  }

  private render() {
    cancelAnimationFrame(this.animationFrame)
    this.animationFrame = requestAnimationFrame(() => {
      this.ensureNotDisposed()
      this.gl.viewport(
        this.viewportController.physicalSpaceRect.left(),
        this.viewportController.physicalSpaceRect.top(),
        this.viewportController.physicalSpaceRect.width(),
        this.viewportController.physicalSpaceRect.height(),
      )

      const positionToPhysical = AffineTransform.betweenRects(
        this.viewportController.viewport,
        this.viewportController.physicalSpaceRect,
      )

      const physicalToNDC = AffineTransform.withTranslation(new Vec2(-1, 1)).times(
        AffineTransform.withScale(new Vec2(2, -2).dividedByPointwise(this.viewportController.physicalSpaceRect.size)),
      )

      const positionToNDC = physicalToNDC.times(positionToPhysical)

      this.boxRender.draw(positionToNDC, positionToPhysical, this.hoverIndex)

      this.textRender.draw(positionToNDC, positionToPhysical)
    })
  }

  private ensureNotDisposed() {
    console.assert(!this.disposed, 'The tree map has been disposed.')
  }
}

export { hierarchy, HierarchyNode, HierarchyRectangularNode } from 'd3-hierarchy'
export { TreeMapData } from './treemap'
export { SearchEngine, NameSearchEngine, Match } from './search'
