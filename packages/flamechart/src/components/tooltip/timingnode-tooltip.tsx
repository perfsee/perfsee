import { Fragment } from 'react'

import { TimingFrame } from '../../lib/timing-profile'
import { TimeFormatter } from '../../lib/value-formatters'

const millisecondTimeFormatter = new TimeFormatter('microseconds')
const formatTiming = (v?: number) => {
  return typeof v === 'number' && isFinite(v) ? millisecondTimeFormatter.format(v) : ''
}
export const TimingTreeNodeTooltip: React.FC<{
  frame: TimingFrame
}> = ({ frame }) => {
  const tipData = {
    Name: frame.info?.name,
    'Total time': formatTiming(frame.info?.duration ?? 0),
  }

  return (
    <div style={{ padding: '0 4px' }}>
      <div style={{ display: 'grid', grid: 'auto / auto auto' }}>
        {Object.keys(tipData).map((name) => {
          return (
            <Fragment key={name}>
              <span style={{ fontWeight: 'bold', paddingRight: '8px' }}>{name}</span>
              <span style={{ textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflowX: 'hidden' }}>
                {tipData[name]}
              </span>
            </Fragment>
          )
        })}
      </div>
    </div>
  )
}
