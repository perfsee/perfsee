import { Fragment, MouseEventHandler, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Color } from '../lib/color'
import { Flamechart, FlamechartFrame } from '../lib/flamechart'
import { FlamechartImage } from '../lib/flamechart-image'
import { Rect } from '../lib/math'
import { Profile } from '../lib/profile'
import { ProfileFrameKeySearch, ProfileSearchEngine } from '../lib/profile-search'
import { Timing } from '../lib/timing'
import { lightTheme, Theme } from '../themes/theme'
import { FlamechartBindingManager } from '../views/flamechart-binding-manager'

import { withErrorBoundary } from './error-catcher'
import { FlamechartFactory, FlamechartFactoryMap } from './flamechart-factory'
import { FlamechartViewContainer, FlamechartViewContainerRef } from './flamechart-view-container'
import { SearchBox, useSearchBoxShortcut } from './search-box'
import SplitView from './split-view'
import { useElementSize } from './utils'

export interface FlamechartGroupContainerProps {
  profiles: {
    name: React.ReactNode
    profile: Profile
    timings?: Timing[]
    flamechartFactory?: FlamechartFactory | keyof typeof FlamechartFactoryMap
    grow?: number
    theme?: Theme
  }[]
  timings?: Timing[]
  images?: FlamechartImage[]
  initialLeft?: number
  initialRight?: number
  minLeft?: number
  maxRight?: number
  disableSearchBox?: boolean
  disableTimelineCursor?: boolean
  disableTooltip?: boolean
  renderTooltip?: (
    frame: FlamechartFrame,
    flamechart: Flamechart,
    theme: Theme,
    profileIndex: number,
  ) => React.ReactNode
  renderTimingTooltip?: (timing: Timing, flamechart: Flamechart, theme: Theme, profileIndex: number) => React.ReactNode
  onSelectFrame?: (frame: FlamechartFrame | null) => void
  onClickTiming?: (click: { timing: Timing; event: MouseEvent } | null) => void
  focusedFrame?: { key: string; parentKeys?: string[] }
  useSimpleDetailView?: boolean
}

const CollapseButton = memo<{ collapsed: boolean; onClick: MouseEventHandler<SVGSVGElement> }>(
  ({ collapsed, onClick }) => {
    return (
      <svg
        width="12"
        height="12"
        viewBox="0 0 48 48"
        fill="none"
        style={{
          verticalAlign: 'text-top',
          margin: '0 4px',
          transform: !collapsed ? 'rotateZ(90deg)' : 'rotateZ(0deg)',
          cursor: 'pointer',
        }}
        onClick={onClick}
      >
        <path
          d="M15 24V11.8756L25.5 17.9378L36 24L25.5 30.0622L15 36.1244V24Z"
          fill="#333"
          stroke="#333"
          strokeWidth="4"
        />
      </svg>
    )
  },
)

const SimpleDetailView: React.FunctionComponent<{ frame: FlamechartFrame; theme: Theme }> = ({ frame, theme }) => {
  return (
    <div
      style={{
        lineHeight: '24px',
        fontFamily: theme.fontFamily,
        color: theme.fgPrimaryColor,
        backgroundColor: theme.bgPrimaryColor,
        fontSize: '12px',
        height: '24px',
        border: `1px solid ${theme.borderColor}`,
        borderWidth: '1px 0 0',
        padding: '0 8px',
        width: '100%',
        whiteSpace: 'nowrap',
        overflowY: 'auto',
      }}
    >
      <span style={{ cursor: 'text' }}>· {frame.node.frame.key}</span>
    </div>
  )
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

export const FlamechartGroupContainer = withErrorBoundary<React.FunctionComponent<FlamechartGroupContainerProps>>(
  memo(
    ({
      profiles,
      initialLeft,
      initialRight,
      minLeft,
      maxRight,
      disableSearchBox,
      disableTimelineCursor,
      disableTooltip,
      renderTooltip,
      renderTimingTooltip,
      timings = [],
      onSelectFrame,
      onClickTiming,
      images = [],
      focusedFrame,
      useSimpleDetailView,
    }) => {
      const containerRef = useRef<HTMLDivElement>(null)
      const bindingManager = useMemo(() => {
        return new FlamechartBindingManager()
      }, [])
      const viewsRef = useRef<(FlamechartViewContainerRef | null)[]>([])
      const { width: containerWidth, height: containerHeight } = useElementSize(containerRef)
      const [searchEngine, setSearchEngine] = useState<ProfileSearchEngine | null>()
      const [searchBoxVisibility, setSearchBoxVisibility] = useState<boolean>()
      const [selectedFrame, setSelectedFrame] = useState<FlamechartFrame | null>()
      const [splitCollapsed, setSplitCollapsed] = useState<(boolean | undefined)[]>([])

      let firstVisibleSplit = -1
      for (let i = 0; i < profiles.length; i++) {
        if (splitCollapsed[i]) {
          firstVisibleSplit = i
        } else {
          break
        }
      }
      firstVisibleSplit += 1
      const splitMinSize = useMemo(
        () => new Array(profiles.length).fill(0).map((_, i) => (splitCollapsed[i] ? 24 : i === 0 ? 125 : 100)),
        [profiles.length, splitCollapsed],
      )
      const [configSplitSize, setConfigSplitSize] = useState<number[]>([])

      const onSizeChange = useCallback(
        (sizes: number[]) => {
          setConfigSplitSize((oldSizes) => {
            return sizes.map((s, i) => {
              if (splitCollapsed[i] === true) {
                return oldSizes[i] ?? (i === 0 ? 125 : 100)
              }
              return s
            })
          })
        },
        [splitCollapsed],
      )

      const finalSplitSize = useMemo(
        () =>
          new Array(profiles.length)
            .fill(0)
            .map((_, i) => (splitCollapsed[i] ? 24 : configSplitSize[i]) ?? splitMinSize[i]),
        [configSplitSize, profiles.length, splitCollapsed, splitMinSize],
      )
      const splitGrow = useMemo(
        () => new Array(profiles.length).fill(0).map((_, i) => (splitCollapsed[i] ? 0 : profiles[i].grow ?? 1)),
        [profiles, splitCollapsed],
      )

      const globalTheme = profiles[0]?.theme ?? lightTheme

      const flamecharts = useMemo(() => {
        return profiles.map((item) => {
          const factory = item.flamechartFactory ?? 'default'
          return (typeof factory === 'string' ? FlamechartFactoryMap[factory] : factory)(item.profile)
        })
      }, [profiles])

      const minValue = useMemo(() => {
        return typeof minLeft === 'number'
          ? minLeft
          : Math.min(...flamecharts.map((flamechart) => flamechart.getMinValue()))
      }, [flamecharts, minLeft])

      const maxValue = useMemo(() => {
        return typeof maxRight === 'number'
          ? maxRight
          : Math.max(...flamecharts.map((flamechart) => flamechart.getMaxValue()))
      }, [flamecharts, maxRight])

      const timingsOnlyLine = useMemo(
        () => timings.map((t) => ({ ...t, name: undefined })).filter((t) => t.style !== 'point'),
        [timings],
      )

      const sashStyle = useMemo<React.CSSProperties>(
        () => ({
          position: 'relative',
          zIndex: 1,
          height: '24px',
          lineHeight: '24px',
          fontFamily: globalTheme.fontFamily,
          fontSize: '12px',
          border: `1px solid ${globalTheme.borderColor}`,
          borderWidth: '1px 0 1px',
          background: Color.fromCSSHex(globalTheme.bgPrimaryColor).withAlpha(0.5).toCSS(),
          color: globalTheme.fgPrimaryColor,
        }),
        [globalTheme],
      )

      const handleClickSash = useMemo(() => {
        return new Array(profiles.length).fill(0).map((_, i) => () => {
          setSplitCollapsed((prev) => {
            const clone = prev.slice()
            clone[i] = !clone[i]
            return clone
          })
        })
      }, [profiles.length])

      const handleViewRefCallback = useMemo(() => {
        return new Array(profiles.length).fill(0).map((_, index) => (ref: FlamechartViewContainerRef | null) => {
          viewsRef.current[index] = ref
        })
      }, [profiles.length])

      const handleSelectFlamechart = useCallback(
        (frame: FlamechartFrame | null) => {
          onSelectFrame?.(frame)
          setSelectedFrame(frame)
        },
        [onSelectFrame],
      )

      const profilesRenderTooltip = useMemo(() => {
        if (typeof renderTooltip !== 'function') {
          return
        }
        return new Array(profiles.length)
          .fill(0)
          .map((_, index) => (frame: FlamechartFrame, flamechart: Flamechart, theme: Theme) => {
            return renderTooltip(frame, flamechart, theme, index)
          })
      }, [profiles.length, renderTooltip])

      const profilesRenderTimingTooltip = useMemo(() => {
        if (typeof renderTimingTooltip !== 'function') {
          return
        }
        return new Array(profiles.length)
          .fill(0)
          .map((_, index) => (timing: Timing, flamechart: Flamechart, theme: Theme) => {
            return renderTimingTooltip(timing, flamechart, theme, index)
          })
      }, [profiles.length, renderTimingTooltip])

      const profilesTiming = useMemo(() => {
        return profiles.map((item, index) => {
          return (index === firstVisibleSplit ? timings : timingsOnlyLine).concat(item.timings ?? [])
        })
      }, [firstVisibleSplit, profiles, timings, timingsOnlyLine])

      const focusedSearchEngine = useMemo(() => {
        if (!focusedFrame) return null
        return new ProfileFrameKeySearch(focusedFrame.key, focusedFrame.parentKeys)
      }, [focusedFrame])

      useEffect(() => {
        viewsRef.current?.forEach((view, i) => {
          if (!view) return
          if (!focusedSearchEngine) return
          view.setSearchResults(focusedSearchEngine)

          const { matchFrames, highestScoreFrame } = flamecharts[i].search(focusedSearchEngine)

          if (matchFrames.length === 0) return

          const viewportRect = view.computeFocusViewportRect(matchFrames, highestScoreFrame)
          if (viewportRect) {
            view.focusToViewportRect(viewportRect, false)
            view.highlightSearchResult()
            if (matchFrames.length === 1) {
              setSelectedFrame(matchFrames[0])
            } else {
              setSelectedFrame(null)
            }
          }
        })
      }, [viewsRef, flamecharts, focusedSearchEngine])

      const lastVisibleView = useMemo(() => {
        let lastVisibleSplit = profiles.length - 1
        for (let i = profiles.length - 1; i >= 0; i--) {
          if (!splitCollapsed[i]) {
            lastVisibleSplit = i
            break
          }
        }
        return lastVisibleSplit
      }, [splitCollapsed, profiles])

      const views = profiles.map((item, index) => {
        const isFirstVisible = index === firstVisibleSplit
        const collapsed = !!splitCollapsed[index]
        const theme = item.theme ?? lightTheme
        const hasOwnedTiming = !!item.timings
        return (width: number, height: number) => (
          <Fragment key={index}>
            <div style={sashStyle}>
              <CollapseButton collapsed={collapsed} onClick={handleClickSash[index]} />
              {item.name}
            </div>
            <FlamechartViewContainer
              ref={handleViewRefCallback[index]}
              flamechart={flamecharts[index]}
              theme={theme}
              initialLeft={initialLeft}
              initialRight={initialRight}
              minLeft={minValue}
              maxRight={maxValue}
              bindingManager={bindingManager}
              disableTimeIndicators={!isFirstVisible}
              disableTimelineCursor={disableTimelineCursor}
              disableTooltip={disableTooltip}
              width={width}
              height={isFirstVisible ? height - 24 : height}
              topPadding={isFirstVisible || hasOwnedTiming ? undefined : 1}
              timings={profilesTiming[index]}
              images={images}
              style={{ top: !isFirstVisible ? '-24px' : 0 }}
              onSelectFrame={handleSelectFlamechart}
              renderTooltip={profilesRenderTooltip?.[index]}
              renderTimingTooltip={profilesRenderTimingTooltip?.[index]}
              onClickTiming={onClickTiming}
              selectedFrame={selectedFrame}
              disableDetailView={index !== lastVisibleView || useSimpleDetailView}
            />
          </Fragment>
        )
      })

      useEffect(() => {
        const focusRects: (Rect | null)[] = []

        for (let i = 0; i < flamecharts.length; i++) {
          viewsRef.current[i]?.setSearchResults(searchEngine ?? undefined)
          if (splitCollapsed[i] || !searchEngine) {
            focusRects.push(null)
            continue
          }
          const searchResult = flamecharts[i].search(searchEngine)
          const rect = viewsRef.current[i]?.computeFocusViewportRect(
            searchResult.matchFrames,
            searchResult.highestScoreFrame,
          )
          if (rect) {
            focusRects.push(rect)
          } else {
            focusRects.push(null)
          }
        }

        const left = focusRects.reduce((prev, rect) => Math.min(prev, rect?.left() ?? Infinity), Infinity)
        const right = focusRects.reduce((prev, rect) => Math.max(prev, rect?.right() ?? -Infinity), -Infinity)

        for (let i = 0; i < flamecharts.length; i++) {
          const focusRect = focusRects[i]
          if (focusRect == null) continue

          viewsRef.current[i]?.focusToViewportRect(
            new Rect(focusRect.origin.withX(left), focusRect.size.withX(right - left)),
            false,
          )
          viewsRef.current[i]?.highlightSearchResult()
        }
      }, [flamecharts, searchEngine, splitCollapsed])

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

      return (
        <>
          <div style={styles.container} ref={containerRef}>
            {!disableSearchBox && searchBoxVisibility && (
              <SearchBox
                onSearch={handleSearch}
                theme={lightTheme}
                style={styles.searchBox}
                onClose={handleCloseSearchBox}
              />
            )}
            {containerWidth && containerHeight && (
              <SplitView
                width={containerWidth}
                height={containerHeight - (useSimpleDetailView ? 24 /** simple detail view height */ : 0)}
                minSize={splitMinSize}
                size={finalSplitSize}
                grow={splitGrow}
                onSizeChange={onSizeChange}
                direction="column"
              >
                {views}
              </SplitView>
            )}
            {useSimpleDetailView && selectedFrame && <SimpleDetailView frame={selectedFrame} theme={globalTheme} />}
          </div>
        </>
      )
    },
  ),
)
