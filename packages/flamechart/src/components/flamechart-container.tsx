import { forwardRef, memo, useCallback, useRef, useState, useImperativeHandle, useMemo, useEffect } from 'react'

import { Flamechart, FlamechartFrame, RootFilter } from '../lib/flamechart'
import { Frame, Profile } from '../lib/profile'
import { ProfileFrameKeySearch, ProfileSearchEngine } from '../lib/profile-search'
import { Timing } from '../lib/timing'
import { lightTheme, Theme } from '../themes/theme'

import { withErrorBoundary } from './error-catcher'
import { FlamechartFactory, FlamechartFactoryMap } from './flamechart-factory'
import { FlamechartViewContainer, FlamechartViewContainerRef } from './flamechart-view-container'
import { SearchBox, useSearchBoxShortcut } from './search-box'
import { useElementSize } from './utils'

export interface FlamechartProps {
  /**
   * the profile object returned by import functions
   */
  profile: Profile
  /**
   * the default focused frame key object
   */
  focusedFrame?: { key: string }
  /**
   * callback when `open file` action triggered
   */
  onRevealFile?: (frame: Frame) => void
  /**
   * custom theme
   */
  theme?: Theme
  /**
   * extra timing values will be drawn down across the chart
   */
  timings?: Timing[]
  /**
   * initial start time when first rendering the chart
   */
  initialLeft?: number
  /**
   * initial end time when first rendering the chart
   */
  initialRight?: number
  /**
   * min value for chart start time
   */
  minLeft?: number
  /**
   * max value for chart end time
   */
  maxRight?: number
  /**
   * show timing labels at the bottom of the chart
   */
  bottomTimingLabels?: boolean
  /**
   * distance to pad below content in the chart
   */
  bottomPadding?: number
  /**
   * distance to pad above content in the chart
   */
  topPadding?: number
  /**
   * flamechart factory
   */
  flamechartFactory?: FlamechartFactory | keyof typeof FlamechartFactoryMap
  /**
   * hidden frame labels
   */
  hiddenFrameLabels?: boolean
  /**
   * whether show stack detail view when focused on certain frame
   */
  disableDetailView?: boolean
  /**
   * disable search box and ctrl-f shortcuts
   */
  disableSearchBox?: boolean
  /**
   * disable the timeline cursor following the mouse
   */
  disableTimelineCursor?: boolean
  /**
   * disable the timeline indicators
   */
  disableTimeIndicators?: boolean
  /**
   * only matched frames will be shown as root frames
   */
  rootFilter?: RootFilter
  /**
   * render custom tooltip
   */
  renderTooltip?: (frame: FlamechartFrame, flamechart: Flamechart, theme: Theme) => React.ReactNode
  /**
   * on select frame
   */
  onSelectFrame?: (frame: FlamechartFrame | null) => void
}

const styles = {
  container: { position: 'relative', height: '100%', overflow: 'hidden' } as React.CSSProperties,
  searchBox: {
    position: 'absolute',
    right: '0px',
    top: '0px',
    zIndex: 10,
  } as React.CSSProperties,
}

export const FlamechartContainer = withErrorBoundary<React.FunctionComponent<FlamechartProps>>(
  memo(
    forwardRef(
      (
        {
          profile,
          focusedFrame,
          theme = lightTheme,
          onRevealFile,
          timings,
          initialLeft,
          initialRight,
          minLeft,
          maxRight,
          disableDetailView,
          flamechartFactory = 'default',
          bottomTimingLabels,
          bottomPadding,
          topPadding,
          hiddenFrameLabels,
          disableSearchBox,
          disableTimelineCursor,
          disableTimeIndicators,
          rootFilter,
          renderTooltip,
          onSelectFrame,
        },
        ref,
      ) => {
        const containerRef = useRef<HTMLDivElement>(null)
        const [view, setView] = useState<FlamechartViewContainerRef | null>(null)
        const { width: containerWidth, height: containerHeight } = useElementSize(containerRef)
        const [searchEngine, setSearchEngine] = useState<ProfileSearchEngine | null>()
        const [searchBoxVisibility, setSearchBoxVisibility] = useState<boolean>()

        const flamechart = useMemo(
          () =>
            (typeof flamechartFactory === 'string' ? FlamechartFactoryMap[flamechartFactory] : flamechartFactory)(
              profile,
              rootFilter,
            ),
          [flamechartFactory, profile, rootFilter],
        )

        useImperativeHandle(ref, () => containerRef.current)

        const focusedSearchEngine = useMemo(() => {
          if (!focusedFrame) return null
          return new ProfileFrameKeySearch(focusedFrame.key)
        }, [focusedFrame])

        const handleSearch = useCallback((searchEngine: ProfileSearchEngine | null) => {
          setSearchEngine(searchEngine)
        }, [])

        const handleCloseSearchBox = useCallback(() => {
          setSearchEngine(null)
          setSearchBoxVisibility(false)
        }, [])

        const handleOpenSearchBox = useCallback(() => {
          setSearchBoxVisibility(true)
        }, [])

        useSearchBoxShortcut(handleOpenSearchBox, handleCloseSearchBox, !!disableSearchBox)

        const searchResults = searchEngine ?? focusedSearchEngine ?? undefined
        useEffect(() => {
          if (!view) return
          view.setSearchResults(searchResults)

          if (!searchResults) return

          const { matchFrames, highestScoreFrame } = flamechart.search(searchResults)

          if (matchFrames.length === 0) return

          const viewportRect = view.computeFocusViewportRect(matchFrames, highestScoreFrame)
          if (viewportRect) {
            view.focusToViewportRect(viewportRect, false)
            view.highlightSearchResult()
          }
        }, [view, flamechart, searchResults])

        return (
          <div style={styles.container} ref={containerRef}>
            {!disableSearchBox && searchBoxVisibility && (
              <SearchBox
                onSearch={handleSearch}
                theme={lightTheme}
                style={styles.searchBox}
                onClose={handleCloseSearchBox}
              />
            )}
            {!!containerWidth && !!containerHeight && (
              <FlamechartViewContainer
                ref={setView}
                flamechart={flamechart}
                theme={theme}
                onOpenFile={onRevealFile}
                timings={timings}
                initialLeft={initialLeft}
                initialRight={initialRight}
                minLeft={minLeft}
                maxRight={maxRight}
                topPadding={topPadding}
                disableDetailView={disableDetailView}
                disableTimelineCursor={disableTimelineCursor}
                disableTimeIndicators={disableTimeIndicators}
                width={containerWidth}
                height={containerHeight}
                bottomTimingLabels={bottomTimingLabels}
                bottomPadding={bottomPadding}
                hiddenFrameLabels={hiddenFrameLabels}
                renderTooltip={renderTooltip}
                onSelectFrame={onSelectFrame}
              />
            )}
          </div>
        )
      },
    ),
  ),
)
