import { useCallback } from 'react'

import { FlamechartFrame } from '../../lib/flamechart'
import { ReactFrame, ReactProfile } from '../../lib/react-devtool/react-profile'
import { lightWeightTheme } from '../../themes/light-weight-theme'
import { Theme } from '../../themes/theme'
import { FlamechartContainer } from '../flamechart-container'

interface Props {
  profile: ReactProfile
  theme?: Theme
  onSelectFiber?: (fiber: { id: number; name: string } | null) => void
}

const styles = {
  container: { height: '100%' } as React.CSSProperties,
}

export const FlamechartReactDevtoolProfileContainer = ({ profile, theme = lightWeightTheme, onSelectFiber }: Props) => {
  const handleSelectFrame = useCallback(
    (frame: FlamechartFrame | null) => {
      if (typeof onSelectFiber === 'function') {
        if (frame === null) {
          onSelectFiber(null)
        } else if (frame.node.frame instanceof ReactFrame) {
          onSelectFiber({ id: frame.node.frame.info.id, name: frame.node.frame.info.name })
        }
      }
    },
    [onSelectFiber],
  )
  return (
    <div style={styles.container}>
      <FlamechartContainer
        profile={profile}
        flamechartFactory="react-profiling"
        theme={theme}
        topPadding={0}
        disableTimelineCursor
        disableDetailView
        disableTimeIndicators
        onSelectFrame={handleSelectFrame}
      />
    </div>
  )
}
