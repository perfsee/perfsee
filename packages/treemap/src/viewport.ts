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

import { easeInOutQuad } from './easing'
import { AffineTransform, Rect, Vec2 } from './math'

export default class ViewportController {
  viewport: Rect = null!
  logicalSpaceRect: Rect = null!
  physicalSpaceRect: Rect = null!
  devicePixelRatio = Math.max(window.devicePixelRatio || 1, 2)
  resizeObserver: ResizeObserver | null = null
  onViewportChange?: (viewport: Rect) => Rect
  onHover?: (position: Vec2, logicalSpacePosition: Vec2) => void
  onHoverEnd?: () => void
  onResize?: (logicalViewport: Rect) => void
  onClick?: (position: Vec2) => void
  viewportTransitionAnimationFrame = -1

  mouseDown = false
  dragging = false
  hover = false
  hoverLogicalSpacePosition: Vec2 | null = null
  lastMousePosition: Vec2 | null = null
  lastGestureScale: number | null = null

  constructor(private element: HTMLCanvasElement, private readonly logicalToPosition: AffineTransform) {
    this.applyDraggingEventListener()
    this.applyHoverListener()
    this.applyResizeListener()
    this.updateElementSize()
  }

  updateViewport(newViewport: Rect, stopAnimation = true) {
    if (stopAnimation) this.stopTransitionAnimation()
    if (this.viewport && newViewport.equals(this.viewport)) {
      return
    }
    if (typeof this.onViewportChange === 'function') {
      newViewport = this.onViewportChange(newViewport)
    }
    this.viewport = newViewport
    if (this.hover && this.hoverLogicalSpacePosition) {
      this.updateHoverPosition(this.hoverLogicalSpacePosition)
    }
  }

  transitionViewport(to: Rect, duration = 300) {
    this.stopTransitionAnimation()
    const startTime = Date.now()
    const from = this.viewport

    const animationLoop = () => {
      const current = (Date.now() - startTime) / duration

      if (current >= 1) {
        this.updateViewport(to, false)
        return
      }

      const left = easeInOutQuad(current, from.left(), to.left())
      const top = easeInOutQuad(current, from.top(), to.top())
      const width = easeInOutQuad(current, from.width(), to.width())
      const height = easeInOutQuad(current, from.height(), to.height())

      this.updateViewport(new Rect(new Vec2(left, top), new Vec2(width, height)), false)
      this.viewportTransitionAnimationFrame = requestAnimationFrame(animationLoop)
    }
    this.viewportTransitionAnimationFrame = requestAnimationFrame(animationLoop)
  }

  stopTransitionAnimation() {
    cancelAnimationFrame(this.viewportTransitionAnimationFrame)
  }

  updateElementSize() {
    this.element.width = this.element.offsetWidth * this.devicePixelRatio
    this.element.height = this.element.offsetHeight * this.devicePixelRatio

    this.physicalSpaceRect = new Rect(new Vec2(0, 0), new Vec2(this.element.width, this.element.height))

    const newLogicalViewport = new Rect(new Vec2(0, 0), new Vec2(this.element.offsetWidth, this.element.offsetHeight))

    let newViewport

    if (this.logicalSpaceRect && this.viewport) {
      const scale = AffineTransform.withScale(
        new Vec2(
          newLogicalViewport.width() / this.logicalSpaceRect.width(),
          newLogicalViewport.height() / this.logicalSpaceRect.height(),
        ),
      )
      newViewport = scale.transformRect(this.viewport)
    } else {
      newViewport = this.logicalToPosition.transformRect(
        new Rect(new Vec2(0, 0), new Vec2(this.element.offsetWidth, this.element.offsetHeight)),
      )
    }

    this.logicalSpaceRect = newLogicalViewport

    if (typeof this.onResize === 'function') {
      this.onResize(this.logicalSpaceRect)
    }
    this.updateViewport(newViewport)
  }

  translateOrigin(deltaX: number, deltaY: number) {
    this.updateViewport(
      AffineTransform.withTranslation(
        new Vec2(deltaX * this.viewport.size.x, deltaY * this.viewport.size.y),
      ).transformRect(this.viewport),
    )
  }

  adjustScaleWithPin(x: number, y: number, ratio: number) {
    const offset = new Vec2(x * this.viewport.size.x, y * this.viewport.size.y)
    this.updateViewport(
      AffineTransform.withTranslation(
        this.viewport.origin.times(1).plus(this.viewport.size.times(0.5)).plus(offset),
      ).transformRect(
        AffineTransform.withScale(new Vec2(ratio, ratio)).transformRect(
          AffineTransform.withTranslation(
            this.viewport.origin.times(-1).plus(this.viewport.size.times(-0.5)).minus(offset),
          ).transformRect(this.viewport),
        ),
      ),
    )
  }

  handleWheel = (e: WheelEvent) => {
    e.preventDefault()

    const deltaRatio = e.deltaMode === e.DOM_DELTA_LINE ? 16 : 1
    const height = this.logicalSpaceRect.height()
    const width = this.logicalSpaceRect.width()

    /**
     * wheel with hold ctrl/command key to scale
     *
     * this will trigger by
     *  - `use mouse wheel with hold ctrl/command key`
     *  - or two-fingers pinch in trackpad
     */
    if (e.ctrlKey || e.metaKey) {
      this.adjustScaleWithPin(
        (e.offsetX - width / 2) / width,
        (e.offsetY - height / 2) / height,
        Math.pow(0.995, e.deltaY * -1 * deltaRatio),
      )
    } else {
      /**
       * wheel only to move viewport
       *
       * this will trigger by
       *  - `use mouse wheel only (or with shift key for reverse)`
       *  - or two-fingers move in trackpad
       */
      this.translateOrigin((e.deltaX / width) * deltaRatio, (e.deltaY / height) * deltaRatio)
    }
  }

  handleMousedown = (e: MouseEvent) => {
    this.mouseDown = true
    this.lastMousePosition = new Vec2(e.clientX, e.clientY)
  }

  handleDraggingMousemove = (e: MouseEvent) => {
    if (this.mouseDown && this.lastMousePosition) {
      this.dragging = true
      const height = this.logicalSpaceRect.height()
      const width = this.logicalSpaceRect.width()

      const newMousePosition = new Vec2(e.clientX, e.clientY)
      const offset = this.lastMousePosition.minus(newMousePosition)
      this.translateOrigin(offset.x / width, offset.y / height)
      this.lastMousePosition = newMousePosition
    }
  }

  handleMouseup = (e: MouseEvent) => {
    if (!this.mouseDown) {
      return
    }
    this.mouseDown = false

    if (!this.dragging) {
      this.handleClick(e)
    }
    this.dragging = false
  }

  handleClick = (e: MouseEvent) => {
    const newMousePosition = new Vec2(e.clientX, e.clientY)
    const elementRect = this.element.getBoundingClientRect()

    const target = new Vec2(
      (newMousePosition.x - elementRect.left) / elementRect.width,
      (newMousePosition.y - elementRect.top) / elementRect.height,
    )
    if (typeof this.onClick === 'function') {
      this.onClick(target.timesPointwise(this.viewport.size).plus(this.viewport.origin))
    }
  }

  handleBlur = () => {
    this.mouseDown = false
    this.dragging = false
  }

  applyDraggingEventListener() {
    this.element.addEventListener('wheel', this.handleWheel)
    this.element.addEventListener('mousedown', this.handleMousedown)

    this.element.addEventListener('mousemove', this.handleDraggingMousemove)
    this.element.addEventListener('mouseup', this.handleMouseup)
    this.element.addEventListener('blur', this.handleBlur)
  }

  removeDraggingEventListener() {
    this.element.removeEventListener('wheel', this.handleWheel)
    this.element.removeEventListener('mousedown', this.handleMousedown)

    this.element.removeEventListener('mousemove', this.handleDraggingMousemove)
    this.element.removeEventListener('mouseup', this.handleMouseup)
    this.element.removeEventListener('blur', this.handleBlur)
  }

  handleHoverMousemove = (e: MouseEvent) => {
    this.updateHoverPosition(new Vec2(e.offsetX, e.offsetY))
  }

  handleHoverEnd = () => {
    this.hover = false
    this.hoverLogicalSpacePosition = null
    if (typeof this.onHoverEnd === 'function') {
      this.onHoverEnd()
    }
  }

  updateHoverPosition(logicalSpacePosition: Vec2) {
    this.hover = true
    this.hoverLogicalSpacePosition = logicalSpacePosition

    if (typeof this.onHover === 'function') {
      const height = this.logicalSpaceRect.height()
      const width = this.logicalSpaceRect.width()
      this.onHover(
        logicalSpacePosition
          .dividedByPointwise(new Vec2(width, height))
          .timesPointwise(this.viewport.size)
          .plus(this.viewport.origin),
        logicalSpacePosition,
      )
    }
  }

  applyHoverListener() {
    this.element.addEventListener('mousemove', this.handleHoverMousemove)
    this.element.addEventListener('mouseleave', this.handleHoverEnd)
    this.element.addEventListener('blur', this.handleHoverEnd)
  }

  removeHoverListener() {
    this.element.removeEventListener('mousemove', this.handleHoverMousemove)
    this.element.removeEventListener('mouseleave', this.handleHoverEnd)
    this.element.removeEventListener('blur', this.handleHoverEnd)
  }

  handleResize = () => {
    this.updateElementSize()
  }

  applyResizeListener() {
    this.resizeObserver = new ResizeObserver(this.handleResize)
    this.resizeObserver.observe(this.element)
  }

  removeResizeListener() {
    this.resizeObserver?.disconnect()
    this.resizeObserver = null
  }

  dispose() {
    this.removeDraggingEventListener()
    this.removeHoverListener()
    this.removeResizeListener()
  }
}
