import { Fragment } from 'react'

import { NetworkFrame } from '../../lib/network-profile'
import { ByteFormatter, TimeFormatter } from '../../lib/value-formatters'

const millisecondTimeFormatter = new TimeFormatter('milliseconds')
const byteFormatter = new ByteFormatter()
const formatRequestInfoSize = (v?: number) => {
  return typeof v === 'number' && isFinite(v) ? byteFormatter.format(v) : ''
}
const formatRequestInfoTiming = (v?: number) => {
  return typeof v === 'number' && isFinite(v) ? millisecondTimeFormatter.format(v) : ''
}

export const NetworkTreeNodeTooltip: React.FC<{
  frame: NetworkFrame
}> = ({ frame }) => {
  const tipData = {
    Url: frame.info?.url,
    Method: frame.info?.method,
    Timing: formatRequestInfoTiming(frame.info?.timing),
    Priority: frame.info?.priority,
    Protocol: frame.info?.protocol,
    Transfer: formatRequestInfoSize(frame.info?.transferSize),
    Size: formatRequestInfoSize(frame.info?.size),
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
