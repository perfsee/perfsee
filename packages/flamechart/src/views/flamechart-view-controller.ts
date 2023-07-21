/* eslint-disable @typescript-eslint/member-ordering */
import { easeInOutCubic, easeInOutQuad } from '../lib/easing'
import { Flamechart, FlamechartFrame } from '../lib/flamechart'
import { FlamechartImage } from '../lib/flamechart-image'
import { AffineTransform, clamp, Rect, Vec2 } from '../lib/math'
import { ProfileSearchEngine } from '../lib/profile-search'
import { Timing } from '../lib/timing'

import { FlamechartBindingManager } from './flamechart-binding-manager'
import { FlamechartViewRenderer, LOGICAL_FRAME_HEIGHT, RenderFeedback, RenderProps } from './flamechart-view-renderer'

export interface ControllerProps {
  minLeft?: number
  maxRight?: number
  initialLeft?: number
  initialRight?: number
  topPadding?: number
  bottomPadding?: number
  onNodeHover?: (hover: { frame: FlamechartFrame; event: MouseEvent } | null) => void
  onTimingHover?: (hover: { timing: Timing; event: MouseEvent } | null) => void
  onNodeSelect?: (frame: FlamechartFrame | null) => void

  disableTimeIndicators?: boolean
  bottomTimingLabels?: boolean
  hiddenFrameLabels?: boolean
  disableTimelineCursor?: boolean
}

/**
 * control the flamechart
 * support zoom, pin, hover, selection and animation
 */
export class FlamechartViewController {
  private viewport: Rect = null!
  private physicalSize: Vec2 = null!
  private devicePixelRatio = 1
  private selectedFrame: FlamechartFrame | undefined = undefined
  private hoverFrame: FlamechartFrame | undefined = undefined
  private matchedOutlineWidth = 0
  private timelineCursor: number | undefined = undefined
  private searchResults: ProfileSearchEngine | undefined = undefined
  private renderFeedback: RenderFeedback | undefined = undefined
  private readonly resizeObserver: ResizeObserver

  constructor(
    private readonly container: HTMLElement,
    private readonly overlayCanvas: HTMLCanvasElement,
    private readonly glCanvas: HTMLCanvasElement,
    private readonly flamechart: Flamechart,
    private readonly renderer: FlamechartViewRenderer,
    private readonly timings: Timing[],
    private readonly images: FlamechartImage[],
    private readonly bindingManager: FlamechartBindingManager | undefined,
    private readonly props: ControllerProps,
  ) {
    this.container.addEventListener('mousedown', this.onMouseDown)
    this.container.addEventListener('mousemove', this.onMouseMove)
    this.container.addEventListener('mouseleave', this.onMouseLeave)
    this.container.addEventListener('click', this.onClick)
    this.container.addEventListener('dblclick', this.onDblClick)
    this.container.addEventListener('wheel', this.onWheel)
    this.resizeObserver = new ResizeObserver(() => requestAnimationFrame(() => this.onResize()))
    this.resizeObserver.observe(this.container)
    this.bindingManager?.addListener(this.onBindingChanged)

    for (const image of images) {
      image.addEventListener('update', this.onUpdateImage)
    }

    const viewSize = this.viewSize()
    const defaultTopPadding = timings.length > 0 && !this.props.bottomTimingLabels ? -2.5 : -1
    const topPadding = typeof this.props.topPadding === 'number' ? -this.props.topPadding : defaultTopPadding
    const initialLeft = props.initialLeft ?? 0
    const initialRight = props.initialRight ?? viewSize.x
    this.viewport = new Rect(
      new Vec2(initialLeft, topPadding),
      new Vec2(initialRight - initialLeft, /* initialize on resize */ 0),
    )

    this.onResize()
  }

  viewSize(): Vec2 {
    return new Vec2(this.flamechart.getMaxValue() - this.flamechart.getMinValue(), this.flamechart.getLayers().length)
  }

  setSearchResults(searchResults: ProfileSearchEngine | undefined) {
    this.searchResults = searchResults
    this.requestRender()
  }

  highlightSearchResult() {
    this.startAnimationMatchedOutline()
  }

  computeFocusViewportRect(frames: FlamechartFrame[], primaryFrame?: FlamechartFrame) {
    if (frames.length === 0) return

    const logicalHeight = this.viewport.size.y
    let left = Infinity
    let right = -Infinity
    let top = Infinity
    let bottom = -Infinity

    frames.forEach((frame) => {
      left = Math.min(left, frame.start)
      right = Math.max(right, frame.end)
      top = Math.min(top, frame.depth)
      bottom = Math.max(bottom, frame.depth)
    })

    const length = right - left
    left = left - length * 0.3
    right = right + length * 0.3
    top = top + (bottom - top) / 2 - logicalHeight / 2
    bottom = top + logicalHeight

    if (primaryFrame) {
      const padding = logicalHeight * 0.3
      if (primaryFrame.depth < top + padding) {
        top = primaryFrame.depth - padding
        bottom = top + logicalHeight
      } else if (primaryFrame.depth > bottom - padding) {
        bottom = primaryFrame.depth + padding
        top = bottom - logicalHeight
      }
    }

    return this.limitViewport(new Rect(new Vec2(left, top), new Vec2(right - left, bottom - top)))
  }

  focusToViewportRect(rect: Rect, animation = false) {
    if (animation) {
      this.startAnimationViewportRect(rect)
    } else {
      this.viewport = rect
      this.requestRender()
      this.notifyViewportBindingChanged()
    }
  }

  focusToFrame(flamechart: FlamechartFrame) {
    const bounds = new Rect(
      new Vec2(flamechart.start, flamechart.depth),
      new Vec2(flamechart.end - flamechart.start, 1),
    )
    const viewportRect = new Rect(bounds.origin.minus(new Vec2(0, 1)), bounds.size.withY(this.viewport.height()))
    this.startAnimationViewportRect(this.limitViewport(viewportRect))
  }

  dispose() {
    this.container.removeEventListener('mousedown', this.onMouseDown)
    this.container.removeEventListener('mousemove', this.onMouseMove)
    this.container.removeEventListener('mouseleave', this.onMouseLeave)
    this.container.removeEventListener('click', this.onClick)
    this.container.removeEventListener('dblclick', this.onDblClick)
    this.container.removeEventListener('wheel', this.onWheel)
    for (const image of this.images) {
      image.removeEventListener('update', this.onUpdateImage)
    }
    this.resizeObserver.disconnect()
    this.bindingManager?.removeListener(this.onBindingChanged)
    this.stopAnimationMatchedOutline()
    this.stopAnimationViewportRect()
  }

  setHoverFrame(frame: FlamechartFrame | undefined) {
    this.hoverFrame = frame
    this.requestRender()
  }

  setSelectFrame(frame: FlamechartFrame | undefined) {
    this.selectedFrame = frame
    this.requestRender()
  }

  private configSpaceToPhysicalViewSpace() {
    return AffineTransform.betweenRects(this.viewport, this.physicalBounds())
  }

  private logicalToPhysicalViewSpace() {
    return AffineTransform.withScale(new Vec2(window.devicePixelRatio, window.devicePixelRatio))
  }

  private physicalBounds(): Rect {
    return new Rect(new Vec2(0, 0), this.physicalSize)
  }

  private pan(logicalViewSpaceDelta: Vec2) {
    const physicalDelta = this.logicalToPhysicalViewSpace().transformVector(logicalViewSpaceDelta)
    const configDelta = this.configSpaceToPhysicalViewSpace().inverseTransformVector(physicalDelta)

    this.hoverFrame = undefined
    this.props.onNodeHover?.(null)
    this.props.onTimingHover?.(null)

    if (!configDelta) return

    this.transformViewport(AffineTransform.withTranslation(configDelta))
  }

  private zoom(logicalViewSpaceCenter: Vec2, multiplier: number) {
    const physicalCenter = this.logicalToPhysicalViewSpace().transformPosition(logicalViewSpaceCenter)
    const configSpaceCenter = this.configSpaceToPhysicalViewSpace().inverseTransformPosition(physicalCenter)
    if (!configSpaceCenter) return

    const zoomTransform = AffineTransform.withTranslation(configSpaceCenter.times(-1))
      .scaledBy(new Vec2(multiplier, 1))
      .translatedBy(configSpaceCenter)

    this.transformViewport(zoomTransform)
  }

  private lastDragPos: Vec2 | null = null
  private mouseDownPos: Vec2 | null = null
  private readonly onMouseDown = (ev: MouseEvent) => {
    this.mouseDownPos = new Vec2(ev.offsetX, ev.offsetY)
    this.lastDragPos = new Vec2(ev.clientX, ev.clientY)
    window.addEventListener('mouseup', this.onWindowMouseUp)
    window.addEventListener('mousemove', this.onWindowMouseMove)
  }

  private updateCursor() {
    if (this.lastDragPos) {
      document.body.style.cursor = 'grabbing'
      document.body.style.cursor = '-webkit-grabbing'
    } else {
      document.body.style.cursor = 'default'
    }
  }

  private readonly onMouseDrag = (ev: MouseEvent) => {
    if (!this.lastDragPos) return
    const logicalMousePos = new Vec2(ev.clientX, ev.clientY)
    this.pan(this.lastDragPos.minus(logicalMousePos))
    this.lastDragPos = logicalMousePos
    this.stopAnimationViewportRect()
    this.requestRender()
    this.notifyViewportBindingChanged()
  }

  private readonly onWindowMouseUp = (_: MouseEvent) => {
    this.lastDragPos = null
    this.updateCursor()
    window.removeEventListener('mouseup', this.onWindowMouseUp)
    window.removeEventListener('mousemove', this.onWindowMouseMove)
    this.requestRender()
  }

  private readonly onWindowMouseMove = (ev: MouseEvent) => {
    ev.preventDefault()
    this.updateCursor()
    this.onMouseDrag(ev)
  }

  private readonly onMouseMove = (ev: MouseEvent) => {
    const logicalViewSpaceMouse = new Vec2(ev.offsetX, ev.offsetY)
    const physicalViewSpaceMouse = this.logicalToPhysicalViewSpace().transformPosition(logicalViewSpaceMouse)
    const configSpaceMouse = this.configSpaceToPhysicalViewSpace().inverseTransformPosition(physicalViewSpaceMouse)

    if (configSpaceMouse) {
      this.timelineCursor = configSpaceMouse?.x
      if (!this.lastDragPos) {
        this.hoverFrame = undefined

        const layers = this.flamechart.getLayers()

        for (let depth = 0; depth < layers.length; depth++) {
          for (const frame of layers[depth]) {
            const width = frame.end - frame.start
            const y = depth
            const configSpaceBounds = new Rect(new Vec2(frame.start, y), new Vec2(width, 1))
            if (configSpaceMouse.x < configSpaceBounds.left()) continue
            if (configSpaceMouse.x > configSpaceBounds.right()) continue

            if (configSpaceBounds.contains(configSpaceMouse)) {
              this.hoverFrame = frame
            }
          }
        }

        this.props.onNodeHover?.(this.hoverFrame ? { frame: this.hoverFrame, event: ev } : null)

        let hoverTiming = undefined
        for (const { area, timing } of this.renderFeedback?.timingPhysicalAreas || []) {
          if (area.contains(physicalViewSpaceMouse)) {
            hoverTiming = timing
          }
        }

        this.props.onTimingHover?.(hoverTiming ? { timing: hoverTiming, event: ev } : null)
      }
    }

    this.requestRender()
    this.notifyTimelineCursorBindingChanged()
  }

  private readonly onMouseLeave = (_: MouseEvent) => {
    this.hoverFrame = undefined
    this.timelineCursor = undefined
    this.props.onNodeHover?.(null)
    this.props.onTimingHover?.(null)
    this.requestRender()
    this.notifyTimelineCursorBindingChanged()
  }

  private readonly onWheel = (ev: WheelEvent) => {
    ev.preventDefault()

    let deltaY = ev.deltaY
    let deltaX = ev.deltaX
    if (ev.deltaMode === ev.DOM_DELTA_LINE) {
      deltaY *= 25
      deltaX *= 25
    }

    // When using the trackpad to scroll horizontally, disable zoom
    if (Math.abs(deltaX) > Math.abs(deltaY)) deltaY = 0

    let multiplier = 1 + deltaY / 100

    // On Chrome & Firefox, pinch-to-zoom maps to
    // WheelEvent + Ctrl Key. We'll accelerate it in
    // this case, since it feels a bit sluggish otherwise.
    if (ev.ctrlKey) {
      multiplier = 1 + deltaY / 40
    }

    multiplier = clamp(multiplier, 0.1, 10.0)

    this.zoom(new Vec2(ev.offsetX, ev.offsetY), multiplier)
    this.pan(new Vec2(deltaX, 0))

    const logicalViewSpaceMouse = new Vec2(ev.offsetX, ev.offsetY)
    const physicalViewSpaceMouse = this.logicalToPhysicalViewSpace().transformPosition(logicalViewSpaceMouse)
    const configSpaceMouse = this.configSpaceToPhysicalViewSpace().inverseTransformPosition(physicalViewSpaceMouse)
    if (configSpaceMouse) {
      this.timelineCursor = configSpaceMouse.x
    }

    this.stopAnimationViewportRect()
    this.requestRender()
    this.notifyViewportBindingChanged()
    this.notifyTimelineCursorBindingChanged()
  }

  private readonly onUpdateImage = () => {
    this.requestRender()
  }

  private readonly onResize = () => {
    const containerRect = this.container.getBoundingClientRect()
    this.devicePixelRatio = window.devicePixelRatio
    const newSize = new Vec2(containerRect.width * this.devicePixelRatio, containerRect.height * this.devicePixelRatio)
    if (this.physicalSize === null || !newSize.equals(this.physicalSize)) {
      this.physicalSize = new Vec2(
        containerRect.width * this.devicePixelRatio,
        containerRect.height * this.devicePixelRatio,
      )
      this.glCanvas.width = this.physicalSize.x
      this.glCanvas.height = this.physicalSize.y
      this.overlayCanvas.width = this.physicalSize.x
      this.overlayCanvas.height = this.physicalSize.y
      this.viewport = this.limitViewport(
        this.viewport.withSize(
          this.viewport.size.withY(this.physicalSize.y / (LOGICAL_FRAME_HEIGHT * this.devicePixelRatio)),
        ),
      )
    }

    this.stopAnimationViewportRect()
    this.syncRender()
  }

  private readonly onClick = (ev: MouseEvent) => {
    const logicalMousePos = new Vec2(ev.offsetX, ev.offsetY)
    const mouseDownPos = this.mouseDownPos
    this.mouseDownPos = null

    if (mouseDownPos && logicalMousePos.minus(mouseDownPos).length() > 5) {
      // If the cursor is more than 5 logical space pixels away from the mouse
      // down location, then don't interpret this event as a click.
      return
    }

    if (this.hoverFrame) {
      this.selectedFrame = this.hoverFrame
      this.props.onNodeSelect?.(this.selectedFrame)
    } else {
      this.selectedFrame = undefined
      this.props.onNodeSelect?.(null)
    }
    this.requestRender()
  }

  private readonly onDblClick = () => {
    if (this.hoverFrame) {
      this.focusToFrame(this.hoverFrame)
    }
  }

  private readonly onBindingChanged = {
    viewport: (x: number, size: number) => {
      this.viewport = this.viewport.withOrigin(this.viewport.origin.withX(x)).withSize(this.viewport.size.withX(size))
      this.stopAnimationViewportRect()
      this.requestRender()
    },
    timelineCursor: (timelineCursor: number | undefined) => {
      this.timelineCursor = timelineCursor
      this.requestRender()
    },
  }

  // Viewport animation
  private animationViewportRectFrameHandler = 0

  private stopAnimationViewportRect() {
    cancelAnimationFrame(this.animationViewportRectFrameHandler)
  }

  private startAnimationViewportRect(to: Rect, duration = 300) {
    this.stopAnimationViewportRect()
    const startTime = Date.now()
    const from = this.viewport
    const loop = () => {
      const current = (Date.now() - startTime) / duration

      if (current >= 1) {
        this.viewport = to.withSize(to.size.withY(this.viewport.size.y))
        this.requestRender()
        this.notifyViewportBindingChanged()
        return
      }

      const left = easeInOutQuad(current, from.left(), to.left())
      const top = easeInOutQuad(current, from.top(), to.top())
      const width = easeInOutQuad(current, from.width(), to.width())

      this.viewport = new Rect(new Vec2(left, top), new Vec2(width, this.viewport.size.y))

      this.requestRender()
      this.notifyViewportBindingChanged()
      this.animationViewportRectFrameHandler = requestAnimationFrame(loop)
    }

    this.animationViewportRectFrameHandler = requestAnimationFrame(loop)
  }

  private animationMatchedOutlineFrameHandler = 0

  private stopAnimationMatchedOutline() {
    cancelAnimationFrame(this.animationMatchedOutlineFrameHandler)
  }

  private startAnimationMatchedOutline(duration = 300, delay = 0) {
    this.stopAnimationMatchedOutline()
    const startTime = Date.now() + delay
    const min = 0
    const max = 5 * this.devicePixelRatio
    const loop = () => {
      const current = (Date.now() - startTime) / duration

      if (current < 0) {
        this.matchedOutlineWidth = min
      } else if (current < 0.5) {
        this.matchedOutlineWidth = easeInOutCubic(current * 2, min, max)
      } else if (current < 1) {
        this.matchedOutlineWidth = easeInOutCubic((current - 0.5) * 2, max, min)
      } else if (current >= 1) {
        this.matchedOutlineWidth = min
        this.requestRender()
        return
      }

      this.requestRender()

      this.animationMatchedOutlineFrameHandler = requestAnimationFrame(loop)
    }

    this.animationMatchedOutlineFrameHandler = requestAnimationFrame(loop)
  }

  private transformViewport(transform: AffineTransform) {
    const targetViewport = transform.transformRect(this.viewport)

    this.viewport = this.limitViewport(targetViewport)
  }

  private limitViewport(viewport: Rect) {
    const maxWidth =
      typeof this.props.maxRight === 'number' && typeof this.props.minLeft === 'number'
        ? this.props.maxRight - this.props.minLeft
        : this.flamechart.getTotalWeight()

    const maxZoom = Math.pow(2, 40)
    const minWidth = maxWidth / maxZoom
    const minLeft = this.props.minLeft ?? this.flamechart.getMinValue()
    const maxRight = this.props.maxRight ?? this.flamechart.getMaxValue()

    const width = clamp(viewport.size.x, minWidth, maxWidth)
    const size = viewport.size.withX(width)

    const defaultTopPadding = this.timings.length > 0 && !this.props.bottomTimingLabels ? -2.5 : -1
    const topPadding = typeof this.props.topPadding === 'number' ? -this.props.topPadding : defaultTopPadding
    const bottomPadding = this.props.bottomPadding ?? 20

    const origin = Vec2.clamp(
      viewport.origin,
      new Vec2(minLeft, topPadding),
      Vec2.max(
        new Vec2(-Infinity, topPadding),
        new Vec2(maxRight, this.flamechart.getLayers().length + bottomPadding).minus(size),
      ),
    )
    return new Rect(origin, size)
  }

  private renderProps(): RenderProps {
    return {
      ...this.props,
      devicePixelRatio: this.devicePixelRatio,
      frameOutlineWidth: 2 * this.devicePixelRatio,
      secondaryOutlineWidth: 1,
      frameTriangleSize: 10 * this.devicePixelRatio,
      matchedOutlineWidth: this.matchedOutlineWidth,
      matchedStrokeWidth: 2 * this.devicePixelRatio,
      disableTimeIndicators: this.props.disableTimeIndicators ?? false,
      hoverFrame: this.hoverFrame,
      searchResults: this.searchResults,
      selectedFrame: this.selectedFrame,
      timelineCursor: this.props.disableTimelineCursor ? undefined : this.timelineCursor,
    }
  }

  private animationFrameRequest = 0
  private requestRender() {
    cancelAnimationFrame(this.animationFrameRequest)
    this.animationFrameRequest = requestAnimationFrame(() => {
      this.renderFeedback = this.renderer.render(
        this.physicalSize.x,
        this.physicalSize.y,
        this.viewport,
        this.renderProps(),
      )
    })
  }

  private syncRender() {
    cancelAnimationFrame(this.animationFrameRequest)
    this.renderFeedback = this.renderer.render(
      this.physicalSize.x,
      this.physicalSize.y,
      this.viewport,
      this.renderProps(),
    )
  }

  private notifyViewportBindingChanged() {
    this.bindingManager?.notifyViewport(this.viewport.origin.x, this.viewport.size.x)
  }

  private notifyTimelineCursorBindingChanged() {
    this.bindingManager?.notifyTimelineCursor(this.timelineCursor)
  }
}
