import { Color } from '../lib/color'
import { Rect, Vec2 } from '../lib/math'
import { Theme } from '../themes/theme'

import { FlamechartColorPassRenderer } from './flamechart-color-pass-renderer'
import { Graphics, WebGL } from './graphics'
import { ViewportRectangleRenderer } from './overlay-rectangle-renderer'
import { RectangleBatchRenderer } from './rectangle-batch-renderer'
import { TextureRenderer } from './texture-renderer'

type FrameCallback = () => void

export class CanvasContext {
  readonly gl: WebGL.Context
  readonly rectangleBatchRenderer: RectangleBatchRenderer
  readonly textureRenderer: TextureRenderer
  readonly viewportRectangleRenderer: ViewportRectangleRenderer
  readonly flamechartColorPassRenderer: FlamechartColorPassRenderer
  readonly theme: Theme

  private animationFrameRequest: number | null = null

  private readonly beforeFrameHandlers = new Set<FrameCallback>()

  constructor(canvas: HTMLCanvasElement, theme: Theme) {
    this.gl = new WebGL.Context(canvas)
    this.rectangleBatchRenderer = new RectangleBatchRenderer(this.gl)
    this.textureRenderer = new TextureRenderer(this.gl)
    this.viewportRectangleRenderer = new ViewportRectangleRenderer(this.gl, theme)
    this.flamechartColorPassRenderer = new FlamechartColorPassRenderer(this.gl, theme)
    this.theme = theme

    // Whenever the canvas is resized, draw immediately. This prevents
    // flickering during resizing.
    this.gl.addAfterResizeEventHandler(this.onBeforeFrame)

    const webGLInfo = this.gl.getWebGLInfo()
    if (webGLInfo) {
      // eslint-disable-next-line no-console
      console.log(
        `WebGL initialized. renderer: ${webGLInfo.renderer}, vendor: ${webGLInfo.vendor}, version: ${webGLInfo.version}`,
      )
    }
    ;(window as any)['testContextLoss'] = () => {
      this.gl.testContextLoss()
    }
  }

  addBeforeFrameHandler(callback: FrameCallback) {
    this.beforeFrameHandlers.add(callback)
  }
  removeBeforeFrameHandler(callback: FrameCallback) {
    this.beforeFrameHandlers.delete(callback)
  }
  requestFrame() {
    if (!this.animationFrameRequest) {
      this.animationFrameRequest = requestAnimationFrame(this.onBeforeFrame)
    }
  }

  setViewport(physicalBounds: Rect, cb: () => void): void {
    const { origin, size } = physicalBounds
    const viewportBefore = this.gl.viewport
    this.gl.setViewport(origin.x, origin.y, size.x, size.y)

    cb()

    const { x, y, width, height } = viewportBefore
    this.gl.setViewport(x, y, width, height)
  }

  renderBehind(clientWidth: number, clientHeight: number, cb: () => void) {
    const physicalBounds = new Rect(
      new Vec2(0, 0),
      new Vec2(clientWidth * window.devicePixelRatio, clientHeight * window.devicePixelRatio),
    )

    this.setViewport(physicalBounds, cb)
  }

  clear() {
    this.gl.setViewport(0, 0, this.gl.renderTargetWidthInPixels, this.gl.renderTargetHeightInPixels)
    const color = Color.fromCSSHex(this.theme.bgPrimaryColor)
    this.gl.clear(new Graphics.Color(color.r, color.g, color.b, color.a))
  }

  private readonly onBeforeFrame = () => {
    this.animationFrameRequest = null
    this.clear()

    for (const handler of this.beforeFrameHandlers) {
      handler()
    }
  }
}
