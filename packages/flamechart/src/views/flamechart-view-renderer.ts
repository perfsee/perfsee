import { CanvasContext } from '../gl/canvas-context'
import { FlamechartRenderer, FlamechartRowAtlasKey } from '../gl/flamechart-renderer'
import { RowAtlas } from '../gl/row-atlas'
import { BatchCanvasRectRenderer, BatchCanvasTextRenderer } from '../lib/canvas-2d-batch-renderers'
import { Color } from '../lib/color'
import { Flamechart, FlamechartFrame } from '../lib/flamechart'
import { AffineTransform, Rect, Vec2 } from '../lib/math'
import { CallTreeNodeAttribute } from '../lib/profile'
import { ProfileSearchEngine } from '../lib/profile-search'
import { cachedMeasureTextWidth, ELLIPSIS, remapRangesToTrimmedText, trimTextMid } from '../lib/text-utils'
import { Timing } from '../lib/timing'
import { assert } from '../lib/utils'
import { Theme } from '../themes/theme'

export const LOGICAL_FRAME_HEIGHT = 25

export interface RenderProps {
  devicePixelRatio: number
  frameOutlineWidth: number
  secondaryOutlineWidth: number
  frameTriangleSize: number
  matchedOutlineWidth: number
  matchedStrokeWidth: number
  timelineCursor?: number
  searchResults?: ProfileSearchEngine
  selectedFrame?: FlamechartFrame
  hoverFrame?: FlamechartFrame

  disableTimeIndicators?: boolean
  bottomTimingLabels?: boolean
  hiddenFrameLabels?: boolean
}

export interface RenderFeedback {
  timingPhysicalAreas: { timing: Timing; area: Rect }[]
}

/**
 * stateless flamechart view renderer
 */
export class FlamechartViewRenderer {
  readonly flamechartRenderer: FlamechartRenderer
  readonly overlayCtx: CanvasRenderingContext2D
  readonly glCtx: CanvasContext
  constructor(
    private readonly overlayCanvas: HTMLCanvasElement,
    private readonly glCanvas: HTMLCanvasElement,
    private readonly flamechart: Flamechart,
    private readonly timings: Timing[],
    private readonly theme: Theme,
  ) {
    this.glCtx = new CanvasContext(this.glCanvas, theme)
    this.overlayCtx = this.overlayCanvas.getContext('2d')!

    if (!this.overlayCtx) {
      throw new Error('Could not get context for overlay canvas')
    }

    this.flamechartRenderer = new FlamechartRenderer(
      this.glCtx.gl,
      new RowAtlas<FlamechartRowAtlasKey>(this.glCtx.gl, this.glCtx.rectangleBatchRenderer, this.glCtx.textureRenderer),
      flamechart,
      this.glCtx.rectangleBatchRenderer,
      this.glCtx.flamechartColorPassRenderer,
      { inverted: false },
    )
  }

  render(width: number, height: number, viewport: Rect, props: RenderProps): RenderFeedback | undefined {
    if (viewport.isEmpty()) {
      return undefined
    }
    assert(width > 0, 'width is zero')
    assert(height > 0, 'height is zero')
    this.renderGl(width, height, viewport)
    return this.renderOverlay(width, height, viewport, props)
  }

  private renderGl(width: number, height: number, viewport: Rect) {
    this.glCtx.gl.resize(width, height)
    this.glCtx.clear()
    this.glCtx.renderBehind(width, height, () => {
      this.flamechartRenderer.render({
        physicalSpaceDstRect: new Rect(new Vec2(0, 0), new Vec2(width, height)),
        configSpaceSrcRect: viewport,
        renderOutlines: true,
      })
    })
  }

  private renderOverlay(width: number, height: number, viewport: Rect, props: RenderProps): RenderFeedback {
    // for hover testing
    const timingPhysicalAreas: { timing: Timing; area: Rect }[] = []

    const ctx = this.overlayCtx

    const physicalSize = new Vec2(width, height)
    const physicalSpace = new Rect(new Vec2(0, 0), physicalSize)
    const viewportToPhysical = AffineTransform.betweenRects(viewport, physicalSpace)

    const physicalFontSize = 11 * props.devicePixelRatio
    const physicalFrameHeight = LOGICAL_FRAME_HEIGHT * props.devicePixelRatio

    ctx.clearRect(0, 0, physicalSize.x, physicalSize.y)

    {
      ctx.font = `${physicalFontSize}px/${physicalFrameHeight}px ${this.theme.fontFamily}`
      ctx.textBaseline = 'alphabetic'

      const minWidthToRender = cachedMeasureTextWidth(ctx, 'M' + ELLIPSIS + 'M')

      const LABEL_PADDING_PX = 5 * props.devicePixelRatio

      const labelBatch = new BatchCanvasTextRenderer()
      const fadedLabelBatch = new BatchCanvasTextRenderer()
      const matchedTextHighlightBatch = new BatchCanvasRectRenderer()
      const directlySelectedOutlineBatch = new BatchCanvasRectRenderer()
      const indirectlySelectedOutlineBatch = new BatchCanvasRectRenderer()
      const matchedFrameBatch = new BatchCanvasRectRenderer()
      const hoveredFrameBatch = new BatchCanvasRectRenderer()
      const longTaskFrameBatch = new BatchCanvasRectRenderer()

      const renderFrameLabel = (frame: FlamechartFrame, configSpaceBounds: Rect) => {
        let physicalLabelBounds = viewportToPhysical.transformRect(configSpaceBounds)

        if (physicalLabelBounds.left() < 0) {
          physicalLabelBounds = physicalLabelBounds
            .withOrigin(physicalLabelBounds.origin.withX(0))
            .withSize(physicalLabelBounds.size.withX(physicalLabelBounds.size.x + physicalLabelBounds.left()))
        }
        if (physicalLabelBounds.right() > physicalSize.x) {
          physicalLabelBounds = physicalLabelBounds.withSize(
            physicalLabelBounds.size.withX(physicalSize.x - physicalLabelBounds.left()),
          )
        }

        if (physicalLabelBounds.width() > minWidthToRender) {
          const match = props.searchResults?.getMatchForNode(frame.node)

          const trimmedText = trimTextMid(
            ctx,
            frame.node.frame.name,
            physicalLabelBounds.width() - 2 * LABEL_PADDING_PX,
          )

          if (match) {
            const rangesToHighlightInTrimmedText = remapRangesToTrimmedText(trimmedText, match.matchedRanges)

            // Once we have the character ranges to highlight, we need to
            // actually do the highlighting.
            let lastEndIndex = 0
            let left = physicalLabelBounds.left() + LABEL_PADDING_PX

            const padding = (physicalFrameHeight - physicalFontSize) / 2 - 2
            for (const [startIndex, endIndex] of rangesToHighlightInTrimmedText) {
              left += cachedMeasureTextWidth(
                ctx,
                trimmedText.trimmedString.substring(lastEndIndex, startIndex),
                props.devicePixelRatio,
              )
              const highlightWidth = cachedMeasureTextWidth(
                ctx,
                trimmedText.trimmedString.substring(startIndex, endIndex),
                props.devicePixelRatio,
              )
              matchedTextHighlightBatch.rect({
                x: left,
                y: physicalLabelBounds.top() + padding,
                w: highlightWidth,
                h: physicalFrameHeight - 2 * padding,
              })

              left += highlightWidth
              lastEndIndex = endIndex
            }
          }

          const batch = props.searchResults != null && !match ? fadedLabelBatch : labelBatch
          batch.text({
            text: trimmedText.trimmedString,

            // This is specifying the position of the starting text baseline.
            x: physicalLabelBounds.left() + LABEL_PADDING_PX,
            y: Math.round(physicalLabelBounds.bottom() - (physicalFrameHeight - physicalFontSize) / 2),
          })
        }
      }

      ctx.strokeStyle = this.theme.selectionSecondaryColor

      const renderSpecialFrameOutlines = (frame: FlamechartFrame, configSpaceBounds: Rect) => {
        if (props.searchResults?.getMatchForNode(frame.node)) {
          const physicalRectBounds = viewportToPhysical.transformRect(configSpaceBounds)
          matchedFrameBatch.rect({
            x: Math.round(physicalRectBounds.left() + props.matchedStrokeWidth / 2 - props.matchedOutlineWidth / 2),
            y: Math.round(physicalRectBounds.top() + props.matchedStrokeWidth / 2 - props.matchedOutlineWidth / 2),
            w: Math.round(
              Math.max(0, physicalRectBounds.width() - props.matchedStrokeWidth + props.matchedOutlineWidth),
            ),
            h: Math.round(
              Math.max(0, physicalRectBounds.height() - props.matchedStrokeWidth + props.matchedOutlineWidth),
            ),
          })
        }

        if (props.selectedFrame != null && frame.node.frame === props.selectedFrame.node.frame) {
          const batch = frame === props.selectedFrame ? directlySelectedOutlineBatch : indirectlySelectedOutlineBatch

          const physicalRectBounds = viewportToPhysical.transformRect(configSpaceBounds)
          batch.rect({
            x: Math.round(physicalRectBounds.left() + props.frameOutlineWidth / 2),
            y: Math.round(physicalRectBounds.top() + props.frameOutlineWidth / 2),
            w: Math.round(Math.max(0, physicalRectBounds.width() - props.frameOutlineWidth)),
            h: Math.round(Math.max(0, physicalRectBounds.height() - props.frameOutlineWidth)),
          })
        }

        if (frame === props.hoverFrame) {
          const physicalRectBounds = viewportToPhysical.transformRect(configSpaceBounds)
          hoveredFrameBatch.rect({
            x: Math.round(physicalRectBounds.left() + props.frameOutlineWidth / 2),
            y: Math.round(physicalRectBounds.top() + props.frameOutlineWidth / 2),
            w: Math.round(Math.max(0, physicalRectBounds.width() - props.frameOutlineWidth)),
            h: Math.round(Math.max(0, physicalRectBounds.height() - props.frameOutlineWidth)),
          })
        }

        if (frame.node.attributes & CallTreeNodeAttribute.LONG_TASK) {
          const physicalRectBounds = viewportToPhysical.transformRect(configSpaceBounds)
          longTaskFrameBatch.rect({
            x: Math.round(physicalRectBounds.left() + props.secondaryOutlineWidth / 2),
            y: Math.round(physicalRectBounds.top() + props.secondaryOutlineWidth / 2),
            w: Math.round(Math.max(0, physicalRectBounds.width() - props.secondaryOutlineWidth)),
            h: Math.round(Math.max(0, physicalRectBounds.height() - props.secondaryOutlineWidth)),
          })
        }
      }

      const layers = this.flamechart.getLayers()

      for (let depth = 0; depth < layers.length; depth++) {
        if (depth + 1 < viewport.top()) continue
        if (depth > viewport.bottom()) continue

        for (const frame of layers[depth]) {
          const width = frame.end - frame.start
          const y = depth
          const configSpaceBounds = new Rect(new Vec2(frame.start, y), new Vec2(width, 1))

          if (configSpaceBounds.left() > viewport.right()) break
          if (configSpaceBounds.right() < viewport.left()) continue

          renderSpecialFrameOutlines(frame, configSpaceBounds)
          if (!props.hiddenFrameLabels) {
            renderFrameLabel(frame, configSpaceBounds)
          }
        }
      }

      const theme = this.theme

      longTaskFrameBatch.fill(ctx, theme.WarningBgColor, false)
      longTaskFrameBatch.stroke(ctx, theme.WarningColor, props.secondaryOutlineWidth, false)
      longTaskFrameBatch.triangle(ctx, theme.WarningColor, props.frameTriangleSize)
      indirectlySelectedOutlineBatch.stroke(ctx, theme.selectionSecondaryColor, props.frameOutlineWidth)
      directlySelectedOutlineBatch.stroke(ctx, theme.selectionPrimaryColor, props.frameOutlineWidth)
      matchedFrameBatch.fill(ctx, theme.searchMatchSecondaryColor, false)
      matchedFrameBatch.stroke(ctx, theme.searchMatchPrimaryColor, props.matchedStrokeWidth + props.matchedOutlineWidth)
      matchedTextHighlightBatch.fill(ctx, theme.searchMatchPrimaryColor)
      fadedLabelBatch.fill(ctx, theme.fgSecondaryColor)
      labelBatch.fill(ctx, props.searchResults != null ? theme.searchMatchTextColor : theme.fgPrimaryColor)
      hoveredFrameBatch.stroke(ctx, theme.fgPrimaryColor, props.frameOutlineWidth)

      // render timing
      const timings = this.timings
      if (timings && timings.length > 0) {
        const sortedTimings = timings.sort((a, b) => a.value - b.value)
        const pointTimings = sortedTimings.filter((t) => t.style === 'point')
        const labelTimings = sortedTimings.filter((t) => t.style !== 'point')

        const labelPaddingHorizontal = 10 * props.devicePixelRatio
        const labelPaddingVertical = 4 * props.devicePixelRatio
        const lineWidth = 1 * props.devicePixelRatio
        const lineDash = [4 * props.devicePixelRatio, 4 * window.devicePixelRatio]

        let lastLabelEnd = -Infinity
        ctx.save()
        ctx.font = `bold ${physicalFontSize}px/${physicalFrameHeight}px ${this.theme.fontFamily}`
        ctx.textBaseline = 'top'
        for (const timing of [...labelTimings, ...pointTimings]) {
          const pos = new Vec2(
            timing.value,
            props.bottomTimingLabels ? this.flamechart.getLayers().length + 0.5 : -0.75,
          )
          const physicalPos = viewportToPhysical.transformPosition(pos)

          const labelText = timing.name
          if (timing.style === 'point') {
            const size = 8 * devicePixelRatio
            ctx.save()
            ctx.setLineDash([])
            ctx.translate(physicalPos.x, physicalPos.y)
            ctx.scale(1, 1)
            ctx.beginPath()
            ctx.moveTo(0, 0)
            ctx.bezierCurveTo(size, -size, size, -(size * 2), 0, -(size * 2))
            ctx.bezierCurveTo(-size, -(size * 2), -size, -size, 0, 0)
            ctx.fillStyle = timing.color
            ctx.lineWidth = lineWidth
            ctx.strokeStyle = theme.bgPrimaryColor
            ctx.fill()
            ctx.stroke()
            ctx.restore()
            timingPhysicalAreas.push({
              timing,
              area: new Rect(new Vec2(physicalPos.x - size, physicalPos.y - size * 2), new Vec2(size * 2, size * 2)),
            })
          } else {
            if (labelText) {
              const textWidth = cachedMeasureTextWidth(ctx, labelText)

              const labelStart = Math.max(physicalPos.x, lastLabelEnd)

              ctx.fillStyle = timing.color
              ctx.fillRect(
                labelStart,
                physicalPos.y - labelPaddingVertical - physicalFontSize,
                labelPaddingHorizontal * 2 + textWidth,
                labelPaddingVertical * 2 + physicalFontSize,
              )
              ctx.fillStyle = '#fff'
              ctx.fillText(labelText, labelStart + labelPaddingHorizontal, physicalPos.y - physicalFontSize)
              lastLabelEnd = labelStart + labelPaddingHorizontal * 2 + textWidth
              timingPhysicalAreas.push({
                timing,
                area: new Rect(
                  new Vec2(labelStart, physicalPos.y - labelPaddingVertical - physicalFontSize),
                  new Vec2(labelPaddingHorizontal * 2 + textWidth, labelPaddingVertical * 2 + physicalFontSize),
                ),
              })
            }

            ctx.beginPath()
            ctx.setLineDash(lineDash)
            ctx.moveTo(physicalPos.x + lineWidth / 2, 0)
            ctx.lineTo(physicalPos.x + lineWidth / 2, physicalSize.y)
            ctx.lineWidth = lineWidth
            ctx.strokeStyle = timing.color
            ctx.stroke()
            ctx.closePath()
          }
        }
        ctx.restore()
      }
    }

    // render time indicators
    {
      const labelPaddingPx = (physicalFrameHeight - physicalFontSize) / 2

      const left = viewport.left()
      const right = viewport.right()

      // We want about 10 gridlines to be visible, and want the unit to be
      // 1eN, 2eN, or 5eN for some N
      // Ideally, we want an interval every 100 logical screen pixels
      const logicalToConfig = (viewportToPhysical.inverted() ?? new AffineTransform()).times(
        AffineTransform.withScale(new Vec2(props.devicePixelRatio, props.devicePixelRatio)),
      )
      const targetInterval = logicalToConfig.transformVector(new Vec2(200, 1)).x
      const minInterval = Math.pow(10, Math.floor(Math.log10(targetInterval)))
      let interval = minInterval
      if (targetInterval / interval > 5) {
        interval *= 5
      } else if (targetInterval / interval > 2) {
        interval *= 2
      }

      {
        const y = 0

        if (!props.disableTimeIndicators) {
          ctx.fillStyle = Color.fromCSSHex(this.theme.bgPrimaryColor).withAlpha(0.8).toCSS()
          ctx.fillRect(0, y, physicalSize.x, physicalFrameHeight)
        }
        ctx.textBaseline = 'top'
        for (let x = Math.ceil(left / interval) * interval; x < right; x += interval) {
          const pos = Math.round(viewportToPhysical.transformPosition(new Vec2(x, 0)).x)
          const labelText = this.flamechart.formatValue(x)
          const textWidth = cachedMeasureTextWidth(ctx, labelText)
          if (!props.disableTimeIndicators) {
            ctx.fillStyle = this.theme.fgPrimaryColor
            ctx.fillText(labelText, pos - textWidth - labelPaddingPx, y + labelPaddingPx)
          }
          ctx.fillStyle = this.theme.borderColor
          ctx.fillRect(pos, 0, 1, physicalSize.y)
        }
      }
    }

    // render timeline cursor
    if (props.timelineCursor !== undefined) {
      const lineWidth = 1 * props.devicePixelRatio
      const labelPaddingPx = (physicalFrameHeight - physicalFontSize) / 2

      const pos = new Vec2(props.timelineCursor, 0)
      const physicalPos = viewportToPhysical.transformPosition(pos).x + lineWidth / 2

      const labelText = this.flamechart.formatValue(props.timelineCursor)
      const textWidth = cachedMeasureTextWidth(ctx, labelText)

      ctx.save()

      ctx.beginPath()
      ctx.moveTo(physicalPos, 0)
      ctx.lineTo(physicalPos, physicalSize.y)
      ctx.lineWidth = lineWidth
      ctx.strokeStyle = this.theme.timelineCursorColor
      ctx.stroke()
      ctx.closePath()

      if (!props.disableTimeIndicators) {
        {
          const x = physicalPos - textWidth / 2 - labelPaddingPx
          const w = textWidth + labelPaddingPx * 2
          const r = 5 * props.devicePixelRatio
          const y = 0
          const h = physicalFrameHeight
          ctx.fillStyle = this.theme.timelineCursorBgColor
          ctx.beginPath()
          ctx.moveTo(x + r, y)
          ctx.arcTo(x + w, y, x + w, y + h, r)
          ctx.arcTo(x + w, y + h, x, y + h, r)
          ctx.arcTo(x, y + h, x, y, r)
          ctx.arcTo(x, y, x + w, y, r)
          ctx.fill()
          ctx.closePath()
        }
        ctx.fillStyle = this.theme.timelineCursorFgColor
        ctx.fillText(labelText, physicalPos - textWidth / 2, labelPaddingPx)
      }

      ctx.restore()
    }

    return {
      timingPhysicalAreas,
    }
  }
}
