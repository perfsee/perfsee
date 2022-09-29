## flamechart

a flamechart component for react.

### Example

```js
import { importMainThreadProfileFromChromeTimeline, FlamechartContainer } from '@perfsee/flamechart'

const rawChromeProfile = require('example-chrome-profile.json')
const profile = importMainThreadProfileFromChromeTimeline(rawChromeProfile)

const render = () => <FlamechartContainer profile={profile} />
```

Notice:

1. `importMainThreadProfileFromChromeTimeline()` is very slow, please cache the results.
2. `<FlamechartContainer />` use '100%' for the height and width, please wrap it with a div parent element with defined width & height.

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
   * only matched frames will be shown as root frames
   */
  rootFilter?: RootFilter
}
```

### Credits

This package is a forked from [speedscope](https://github.com/jlfwong/speedscope)
