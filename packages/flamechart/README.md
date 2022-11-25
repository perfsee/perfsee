## flamechart

a flamechart component for react.

[![example](https://user-images.githubusercontent.com/13579374/194684518-f5f73324-f622-475c-b75c-939d91830d1c.png)](https://codesandbox.io/s/flamechart-simple-example-xkg4uw?file=/src/App.js)

### Usage

```js
import { importMainThreadProfileFromChromeTimeline, FlamechartContainer } from '@perfsee/flamechart'

const rawChromeProfile = require('example-chrome-profile.json')
const profile = importMainThreadProfileFromChromeTimeline(rawChromeProfile)

const render = () => <FlamechartContainer profile={profile} />
```

Notice:

1. `importMainThreadProfileFromChromeTimeline()` is very slow, please cache the results.
2. `<FlamechartContainer />` use '100%' for the height and width, please wrap it with a div parent element with defined width & height.

### Example

[simple graph](https://codesandbox.io/s/flamechart-simple-example-xkg4uw)

[color themes](https://codesandbox.io/s/flamechart-theme-example-qpxhmt)

[flamechart with timings](https://codesandbox.io/s/flamechart-timing-example-lbmglt)

[multiple graph](https://codesandbox.io/s/flamechart-group-example-yswipr)

[network graph](https://codesandbox.io/s/flamechart-network-graph-example-tjlq9p)

### Props

```ts
interface FlamechartProps {
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
   * flamechart factory
   */
  flamechartFactory?: FlamechartFactory
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
   * only matched frames will be shown as root frames
   */
  rootFilter?: RootFilter
  /**
   * render custom tooltip
   */
  renderTooltip?: (frame: FlamechartFrame, flamechart: Flamechart, theme: Theme) => React.ReactNode
}
```

### Credits

This package is a forked from [speedscope](https://github.com/jlfwong/speedscope)
