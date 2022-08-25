import { Flamechart, FlamechartFrame } from '../lib/flamechart'
import { Rect } from '../lib/math'
import { ProfileSearchEngine } from '../lib/profile-search'
import { Timing } from '../lib/timing'
import { Theme } from '../themes/theme'

import { FlamechartBindingManager } from './flamechart-binding-manager'
import { ControllerProps, FlamechartViewController } from './flamechart-view-controller'
import { FlamechartViewRenderer } from './flamechart-view-renderer'

export interface Props extends ControllerProps {}

export class FlamechartView {
  private readonly innerContainer: HTMLElement
  private readonly renderer: FlamechartViewRenderer
  private readonly controller: FlamechartViewController
  constructor(
    container: HTMLElement,
    flamechart: Flamechart,
    timings: Timing[],
    theme: Theme,
    bindingManager: FlamechartBindingManager | undefined,
    props: Props,
  ) {
    this.innerContainer = document.createElement('div')
    this.innerContainer.style.width = '100%'
    this.innerContainer.style.height = '100%'
    this.innerContainer.style.position = 'relative'

    const overlayCanvas = document.createElement('canvas')
    overlayCanvas.style.width = '100%'
    overlayCanvas.style.height = '100%'
    overlayCanvas.style.position = 'absolute'
    overlayCanvas.style.top = '0'
    overlayCanvas.style.left = '0'

    const glCanvas = document.createElement('canvas')
    glCanvas.style.width = '100%'
    glCanvas.style.height = '100%'
    glCanvas.style.position = 'absolute'
    glCanvas.style.top = '0'
    glCanvas.style.left = '0'

    this.innerContainer.appendChild(glCanvas)
    this.innerContainer.appendChild(overlayCanvas)
    container.appendChild(this.innerContainer)

    this.renderer = new FlamechartViewRenderer(overlayCanvas, glCanvas, flamechart, timings, theme)
    this.controller = new FlamechartViewController(
      this.innerContainer,
      overlayCanvas,
      glCanvas,
      flamechart,
      this.renderer,
      timings,
      bindingManager,
      props,
    )
  }

  dispose() {
    this.controller.dispose()
    this.innerContainer.remove()
  }

  computeFocusViewportRect(frames: FlamechartFrame[], primaryFrame?: FlamechartFrame) {
    return this.controller.computeFocusViewportRect(frames, primaryFrame)
  }

  focusToViewportRect(rect: Rect, animation = false) {
    return this.controller.focusToViewportRect(rect, animation)
  }

  setHoverFrame(frame: FlamechartFrame | undefined) {
    return this.controller.setHoverFrame(frame)
  }

  setSelectFrame(frame: FlamechartFrame | undefined) {
    return this.controller.setSelectFrame(frame)
  }

  focusToFrame(flamechart: FlamechartFrame) {
    return this.controller.focusToFrame(flamechart)
  }

  setSearchResults(searchResults: ProfileSearchEngine | undefined) {
    return this.controller.setSearchResults(searchResults)
  }

  highlightSearchResult() {
    return this.controller.highlightSearchResult()
  }
}
